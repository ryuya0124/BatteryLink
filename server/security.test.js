import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import app from './index.js';
import { sha256 } from './api/utils.js';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };
const domain = 'security-test.auth0.example';
const audience = 'https://security-test.example/';
async function token(subject) {
  return new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
    .setIssuer('https://' + domain + '/').setAudience(audience).setSubject(subject)
    .setIssuedAt().setExpirationTime('5m').sign(privateKey);
}

function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'));
  t.after(() => sql.close());
  const DB = {
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sql.exec('COMMIT');
        return results;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
    prepare(query) {
      return { bind(...values) {
        const statement = sql.prepare(query);
        return {
          async all() { return { results: statement.all(...values) }; },
          async first() { return statement.get(...values) ?? null; },
          async run() { return { meta: { changes: statement.run(...values).changes } }; },
        };
      } };
    },
  };
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(String(url), 'https://' + domain + '/.well-known/jwks.json');
    return Response.json({ keys: [jwk] });
  });
  return { sql, env: { DB, AUTH0_DOMAIN: domain, AUTH0_AUDIENCE: audience } };
}

test('signed Auth0 token cannot read, edit or delete another user device or settings', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,last_updated) VALUES (?,?,?,?)").run('victim-device', 'victim', 'Private device', '2026-09-08T00:00:00Z');
  const auth = { Authorization: 'Bearer ' + await token('attacker'), 'Content-Type': 'application/json' };
  const list = await app.request('/api/devices', { headers: auth }, env);
  assert.deepEqual(await list.json(), []);
  for (const [method, path, body] of [
    ['GET', '/api/battery/victim-device', undefined],
    ['PATCH', '/api/devices/victim-device', { name: 'hijacked' }],
    ['DELETE', '/api/devices/victim-device', undefined],
    ['PATCH', '/api/auth/device-display-settings', { device_uuid: 'victim-device', show_temperature: false, show_voltage: false }],
  ]) {
    const response = await app.request(path, { method, headers: auth, body: body && JSON.stringify(body) }, env);
    assert.equal(response.status, 404, method + ' ' + path);
  }
  assert.equal(sql.prepare('SELECT name FROM devices').get().name, 'Private device');
  assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM device_display_settings').get().count, 0);
});

test('API key cannot target another owner, and cannot delete even its own device', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,last_updated) VALUES ('own','owner','Owned','2026-09-08'),('other','victim','Private','2026-09-08')").run();
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('key', 'owner', await sha256('telemetry-key'));
  const headers = { 'x-api-key': 'telemetry-key', 'Content-Type': 'application/json' };
  const update = await app.request('/api/devices/other', { method: 'PUT', headers, body: JSON.stringify({ battery_level: 1, is_charging: false }) }, env);
  assert.equal(update.status, 403);
  assert.equal(sql.prepare('SELECT last_used_at FROM api_keys').get().last_used_at, null);
  const deletion = await app.request('/api/devices/own', { method: 'DELETE', headers }, env);
  assert.equal(deletion.status, 401);
  assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM devices').get().count, 2);
});

test('API key management requires ownership and never returns stored hashes', async t => {
  const { sql, env } = fixture(t);
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('victim-key', 'victim', 'hidden-hash');
  const headers = { Authorization: 'Bearer ' + await token('attacker'), 'Content-Type': 'application/json' };
  for (const method of ['PATCH', 'DELETE']) {
    const response = await app.request('/api/api-keys/victim-key', { method, headers, body: JSON.stringify({ label: 'attack' }) }, env);
    assert.equal(response.status, 404);
  }
  const list = await app.request('/api/api-keys', { headers: { Authorization: 'Bearer ' + await token('victim') } }, env);
  assert.equal((await list.text()).includes('hidden-hash'), false);
});

test('machine-to-machine token is not a user login', async t => {
  const { env } = fixture(t);
  const response = await app.request('/api/devices', { headers: { Authorization: 'Bearer ' + await token('client@clients') } }, env);
  assert.equal(response.status, 401);
});

test('large request and rate-limit rejection do not reach database handlers', async () => {
  const large = await app.request('/api/devices', { method: 'POST', body: 'x'.repeat(17000) }, {});
  assert.equal(large.status, 413);
  const limited = await app.request('/api/devices', {}, { API_RATE_LIMITER: { async limit() { return { success: false }; } } });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
});

test('complete device sync lifecycle: issue key, register, send, read, rename, revoke, reject', async t => {
  const { sql, env } = fixture(t);
  const headers = { Authorization: 'Bearer ' + await token('sync-owner'), 'Content-Type': 'application/json' };
  const request = (path, method = 'GET', body, auth = headers) => app.request('/api' + path, {
    method, headers: auth, body: body === undefined ? undefined : JSON.stringify(body),
  }, env);
  const issued = await request('/api-keys', 'POST', { label: 'isolated-lifecycle-test' });
  assert.equal(issued.status, 201, await issued.clone().text());
  const { apiKey, id } = await issued.json();
  assert.match(apiKey, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(sql.prepare('SELECT key_hash FROM api_keys WHERE id = ?').get(id).key_hash, await sha256(apiKey));
  const registered = await request('/devices', 'POST', {
    uuid: 'sync-lifecycle-device', name: 'Sync test', brand: 'Test', model: 'Fixture', model_number: '', battery_level: null, is_charging: false,
  });
  assert.equal(registered.status, 201, await registered.clone().text());
  const initial = await (await request('/devices')).json();
  assert.equal(initial[0].battery_level, null);
  const deviceHeaders = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
  for (const [level, charging] of [[82, true], [0, false], [100, 1], [27, 0]]) {
    const before = Date.now();
    const sent = await request('/devices/sync-lifecycle-device', 'PUT', {
      battery_level: level, is_charging: charging, temperature: 0, voltage: '4.1', os_version: 'test-os',
    }, deviceHeaders);
    assert.equal(sent.status, 200, await sent.clone().text());
    const list = await (await request('/devices')).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].battery_level, level);
    assert.equal(Boolean(list[0].is_charging), Boolean(charging));
    assert.equal(list[0].temperature, 0);
    assert.equal(list[0].voltage, '4.1');
    assert.ok(new Date(list[0].last_updated).getTime() >= before - 1000);
    const battery = await request('/battery/sync-lifecycle-device');
    assert.equal(battery.status, 200);
    assert.equal((await battery.json()).data.battery_level, level);
  }
  const keyList = await (await request('/api-keys')).json();
  assert.equal(keyList[0].id, id);
  assert.ok(keyList[0].last_used_at);
  assert.equal(JSON.stringify(keyList).includes(apiKey), false);
  assert.equal('key_hash' in keyList[0], false);
  assert.equal((await request('/api-keys/' + id, 'PATCH', { label: 'renamed' })).status, 200);
  assert.equal((await (await request('/api-keys')).json())[0].label, 'renamed');
  assert.equal((await request('/api-keys/' + id, 'DELETE')).status, 200);
  const stale = await request('/devices/sync-lifecycle-device', 'PUT', { battery_level: 1, is_charging: false }, deviceHeaders);
  assert.equal(stale.status, 403);
  assert.equal((await (await request('/devices')).json())[0].battery_level, 27);
  assert.equal((await request('/devices/sync-lifecycle-device', 'DELETE')).status, 200);
  assert.deepEqual(await (await request('/devices')).json(), []);
});

test('sync works with the legacy production devices schema and numeric voltage', async t => {
  const { sql, env } = fixture(t);
  sql.exec(`DROP TABLE devices; CREATE TABLE devices (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, uuid TEXT UNIQUE NOT NULL,
    name TEXT, brand TEXT, model TEXT, os_version TEXT, model_number TEXT,
    battery_level INTEGER, is_charging BOOLEAN, temperature REAL, voltage TEXT, last_updated DATETIME
  );`);
  const headers = { Authorization: 'Bearer ' + await token('legacy-owner'), 'Content-Type': 'application/json' };
  const created = await app.request('/api/devices', { method: 'POST', headers, body: JSON.stringify({ uuid: 'legacy', name: 'Legacy' }) }, env);
  assert.equal(created.status, 201);
  const keyResponse = await app.request('/api/api-keys', { method: 'POST', headers, body: '{}' }, env);
  assert.equal(keyResponse.status, 201);
  const { apiKey } = await keyResponse.json();
  const sent = await app.request('/api/devices/legacy', { method: 'PUT', headers: { 'x-api-key': apiKey }, body: JSON.stringify({ battery_level: 47, is_charging: 1, voltage: 4.2, temperature: 0 }) }, env);
  assert.equal(sent.status, 200);
  const fetched = await app.request('/api/devices', { headers }, env);
  const [device] = await fetched.json();
  assert.equal(device.battery_level, 47);
  assert.equal(device.is_charging, 1);
  assert.equal(device.voltage, '4.2');
  assert.equal(device.temperature, 0);
  assert.equal('id' in device, false);
});

test('invalid telemetry changes neither key usage nor device measurements', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,battery_level,last_updated) VALUES ('diagnostic','owner','Diagnostic',64,'2020-01-01T00:00:00Z')").run();
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('diagnostic-key', 'owner', await sha256('diagnostic-key-value'));
  const response = await app.request('/api/devices/diagnostic', { method: 'PUT', headers: { 'x-api-key': 'diagnostic-key-value' }, body: JSON.stringify({ battery_level: '82', is_charging: 'true' }) }, env);
  assert.equal(response.status, 400);
  assert.equal(sql.prepare('SELECT battery_level FROM devices').get().battery_level, 64);
  assert.equal(sql.prepare('SELECT last_updated FROM devices').get().last_updated, '2020-01-01T00:00:00Z');
  assert.equal(sql.prepare('SELECT last_used_at FROM api_keys').get().last_used_at, null);
});

test('omitted optional telemetry preserves previous measurements; explicit null clears them', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,battery_level,temperature,voltage,os_version,last_updated) VALUES ('sensors','owner','Sensors',64,23,'4.2','test-os','2020-01-01T00:00:00Z')").run();
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('sensors-key', 'owner', await sha256('sensors-key-value'));
  const response = await app.request('/api/devices/sensors', { method: 'PUT', headers: { 'x-api-key': 'sensors-key-value' }, body: JSON.stringify({ battery_level: 65, is_charging: false }) }, env);
  assert.equal(response.status, 200);
  const actual = sql.prepare('SELECT battery_level,temperature,voltage,os_version FROM devices').get();
  assert.equal(actual.battery_level, 65);
  assert.equal(actual.temperature, 23);
  assert.equal(actual.voltage, '4.2');
  assert.equal(actual.os_version, 'test-os');
  const cleared = await app.request('/api/devices/sensors', { method: 'PUT', headers: { 'x-api-key': 'sensors-key-value' }, body: JSON.stringify({ battery_level: 65, is_charging: false, temperature: null, voltage: null, os_version: null }) }, env);
  assert.equal(cleared.status, 200);
  const after = sql.prepare('SELECT temperature,voltage,os_version FROM devices').get();
  assert.equal(after.temperature, null);
  assert.equal(after.voltage, null);
  assert.equal(after.os_version, null);
});

test('failed telemetry transaction rolls back both measurement and API key usage', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,battery_level,last_updated) VALUES ('atomic','owner','Atomic',64,'2020-01-01T00:00:00Z')").run();
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('atomic-key', 'owner', await sha256('atomic-value'));
  sql.exec("CREATE TRIGGER fail_usage BEFORE UPDATE ON api_keys BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END;");
  const response = await app.request('/api/devices/atomic', { method: 'PUT', headers: { 'x-api-key': 'atomic-value' }, body: JSON.stringify({ battery_level: 90, is_charging: true }) }, env);
  assert.equal(response.status, 500);
  assert.equal(sql.prepare('SELECT battery_level FROM devices').get().battery_level, 64);
  assert.equal(sql.prepare('SELECT last_updated FROM devices').get().last_updated, '2020-01-01T00:00:00Z');
  assert.equal(sql.prepare('SELECT last_used_at FROM api_keys').get().last_used_at, null);
});

test('key revocation between authentication and storage prevents a telemetry write', async t => {
  const { sql, env } = fixture(t);
  sql.prepare("INSERT INTO devices (uuid,user_id,name,battery_level,last_updated) VALUES ('race','owner','Race',64,'2020-01-01T00:00:00Z')").run();
  sql.prepare('INSERT INTO api_keys (id,user_id,key_hash) VALUES (?,?,?)').run('race-key', 'owner', await sha256('race-value'));
  const batch = env.DB.batch;
  env.DB.batch = statements => {
    sql.prepare('DELETE FROM api_keys WHERE id = ?').run('race-key');
    return batch(statements);
  };
  const response = await app.request('/api/devices/race', { method: 'PUT', headers: { 'x-api-key': 'race-value' }, body: JSON.stringify({ battery_level: 90, is_charging: true }) }, env);
  assert.equal(response.status, 403);
  assert.equal(sql.prepare('SELECT battery_level FROM devices').get().battery_level, 64);
});
