import test from 'node:test';
import assert from 'node:assert/strict';
import app from './index.js';
import { deleteAccountData } from './api/handlers/accountDeleteHandler.js';

function database() {
  const writes = [];
  return {
    writes,
    async batch(statements) { return Promise.all(statements.map(statement => statement.run())); },
    prepare(sql) {
      return { bind(...values) {
        assert.ok(values.every(value => value !== undefined), 'D1 cannot bind undefined');
        return {
          async all() {
            return { results: sql.includes('api_keys') ? [{ id: 'key', user_id: 'owner' }] : [{ uuid: 'device', user_id: 'owner' }] };
          },
          async run() { writes.push({ sql, values }); return { meta: { changes: 1 } }; },
        };
      } };
    },
  };
}

test('expired or malformed JWT is an authentication error, not a server error', async () => {
  for (const path of ['/api/devices', '/api/auth/me', '/api/battery/device', '/api/api-keys', '/api/auth/identities']) {
    const response = await app.request(path, { headers: { Authorization: 'Bearer invalid' } }, {});
    assert.equal(response.status, 401, path);
  }
});

test('invalid JWT on mutation routes returns 401 consistently', async () => {
  for (const [method, path] of [
    ['POST', '/api/devices'], ['PATCH', '/api/devices/device'],
    ['POST', '/api/api-keys'], ['PATCH', '/api/api-keys/key'],
    ['DELETE', '/api/api-keys/key'], ['DELETE', '/api/auth/account'],
    ['PATCH', '/api/auth/auto-update'], ['PATCH', '/api/auth/device-display-settings'],
  ]) {
    const response = await app.request(path, {
      method, headers: { Authorization: 'Bearer invalid', 'Content-Type': 'application/json' }, body: '{}',
    }, {});
    assert.equal(response.status, 401, path);
  }
});

test('API telemetry accepts legacy 0/1 and omitted optional measurements', async () => {
  for (const charging of [true, false, 0, 1]) {
    const DB = database();
    const response = await app.request('/api/devices/device', {
      method: 'PUT', headers: { 'x-api-key': 'test-key', 'Content-Type': 'application/json' },
      body: JSON.stringify({ battery_level: 42, is_charging: charging }),
    }, { DB });
    assert.equal(response.status, 200);
    const update = DB.writes.find(write => write.sql.includes('UPDATE devices'));
    assert.deepEqual(update.values.slice(0, 8), [42, charging ? 1 : 0, 0, null, 0, null, 0, null]);
  }
});

test('invalid JSON, null bodies and invalid telemetry never write devices', async () => {
  for (const body of ['{', 'null', '[]', JSON.stringify({ battery_level: 101, is_charging: false }), JSON.stringify({ battery_level: 50, is_charging: 'false' })]) {
    const DB = database();
    const response = await app.request('/api/devices/device', {
      method: 'PUT', headers: { 'x-api-key': 'test-key', 'Content-Type': 'application/json' }, body,
    }, { DB });
    assert.equal(response.status, 400, body);
    assert.equal(DB.writes.filter(write => write.sql.includes('UPDATE devices')).length, 0);
    assert.equal(DB.writes.filter(write => write.sql.includes('UPDATE api_keys')).length, 0);
  }
});

test('unknown API paths return JSON, never the SPA', async () => {
  const response = await app.request('/api/missing');
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, 'Not Found');
});

test('account deletion never reports success when Auth0 deletion fails', async (t) => {
  const methods = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    methods.push(init.method);
    return methods.length === 1 ? Response.json({ access_token: 'management-token' }) : new Response('', { status: 503 });
  });
  let batched = false;
  const env = {
    MGMT_CLIENT_ID: 'test', MGMT_CLIENT_SECRET: 'test',
    DB: {
      prepare(sql) { return { bind(user) { return { sql, user }; } }; },
      async batch(statements) {
        assert.equal(statements.length, 4);
        assert.ok(statements.every(statement => statement.user === 'owner'));
        batched = true;
        return statements.map(() => ({ meta: { changes: 1 } }));
      },
    },
  };
  await assert.rejects(deleteAccountData(env, 'owner'), { status: 502 });
  assert.equal(batched, true);
});

test('D1 failure prevents deletion of the Auth0 identity', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    return Response.json({ access_token: 'management-token' });
  });
  const env = {
    MGMT_CLIENT_ID: 'test', MGMT_CLIENT_SECRET: 'test',
    DB: {
      prepare() { return { bind() { return {}; } }; },
      async batch() { throw new Error('D1 unavailable'); },
    },
  };
  await assert.rejects(deleteAccountData(env, 'owner'), /D1 unavailable/);
  assert.equal(calls, 1);
});

test('API key browser preflight succeeds without sending the key in OPTIONS', async () => {
  const response = await app.request('/api/devices/device', {
    method: 'OPTIONS', headers: {
      Origin: 'https://device-client.example',
      'Access-Control-Request-Method': 'PUT',
      'Access-Control-Request-Headers': 'content-type,x-api-key',
    },
  });
  assert.ok(['*', 'https://device-client.example'].includes(response.headers.get('Access-Control-Allow-Origin')));
});
