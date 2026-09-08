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
