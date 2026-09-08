import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] || 'http://localhost:8787').origin;
const results = [];
async function check(path, init, expected, contentType) {
  const response = await fetch(origin + path, { ...init, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  results.push({ path, method: init?.method || 'GET', status: response.status });
  assert.equal(response.status, expected, path);
  if (contentType) assert.ok(response.headers.get('Content-Type')?.includes(contentType), path);
  return response;
}
await check('/', {}, 200, 'text/html');
await check('/dashboard', { headers: { 'Sec-Fetch-Mode': 'navigate' } }, 200, 'text/html');
await check('/api/missing', { headers: { 'Sec-Fetch-Mode': 'navigate' } }, 404, 'application/json');
for (const path of ['/api/devices', '/api/api-keys', '/api/auth/me']) {
  await check(path, {}, 401);
  await check(path, { headers: { Authorization: 'Bearer invalid-smoke-test' } }, 401);
}
const preflight = await check('/api/devices/smoke-test-nonexistent', {
  method: 'OPTIONS',
  headers: { Origin: 'https://device-client.example', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type,x-api-key' },
}, 204);
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
console.log(JSON.stringify({ origin, passed: results.length, results }, null, 2));
