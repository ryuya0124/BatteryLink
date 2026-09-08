import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual hook callbacks with controlled transport and state setters.
// This is not a browser-rendering test and does not use production credentials.
function hookFixture() {
  const source = readFileSync(new URL('../src/hooks/useDevices.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const pending = [];
  const states = [];
  const loadingEvents = [];
  const cleanups = [];
  const exports = {};
  const react = {
    useRef: current => ({ current }),
    useEffect: callback => { const cleanup = callback(); if (cleanup) cleanups.push(cleanup); },
    useCallback: callback => callback,
    useState(initial) {
      const index = states.length;
      states.push(typeof initial === 'function' ? initial() : initial);
      return [states[index], value => {
        states[index] = typeof value === 'function' ? value(states[index]) : value;
        if (index === 1) loadingEvents.push(states[index]);
      }];
    },
  };
  vm.runInNewContext(code, {
    exports, console, Set,
    require(name) {
      if (name === 'react') return react;
      if (name === '@auth0/auth0-react') return { useAuth0: () => ({ getAccessTokenSilently: async () => 'local-test-only' }) };
      if (name === '@/lib/utils') return { fetchWithAuth: () => new Promise(resolve => pending.push(resolve)) };
      throw new Error('Unexpected import: ' + name);
    },
  });
  const hook = exports.useDevices({ id: 'test-owner', email: 'test@example.invalid' });
  return { hook, pending, states, loadingEvents, unmount: () => cleanups.forEach(cleanup => cleanup()) };
}

test('slower older device response cannot replace a newer sync snapshot', async () => {
  const { hook, pending, states } = hookFixture();
  const older = hook.fetchDevices();
  const newer = hook.fetchDevices();
  pending[1](Response.json([{ uuid: 'test', battery_level: 82, is_charging: 1 }]));
  await newer;
  assert.equal(states[0][0].battery_level, 82);
  pending[0](Response.json([{ uuid: 'test', battery_level: 40, is_charging: 0 }]));
  await older;
  assert.equal(states[0][0].battery_level, 82);
});

test('failed device refresh preserves the last successful data', async () => {
  const { hook, pending, states } = hookFixture();
  const first = hook.fetchDevices();
  pending[0](Response.json([{ uuid: 'test', battery_level: 82, is_charging: 1 }]));
  await first;
  const failed = hook.fetchDevices();
  pending[1](Response.json({ error: 'Unavailable' }, { status: 503 }));
  await assert.rejects(failed, /デバイス一覧の取得に失敗/);
  assert.equal(states[0][0].battery_level, 82);
  assert.equal(states[0][0].is_charging, true);
  assert.equal(states[1], false);
});

test('background refresh does not raise the full-screen loading flag', async () => {
  const { hook, pending, loadingEvents } = hookFixture();
  for (let i = 0; i < 2; i++) {
    const refresh = hook.fetchDevices();
    pending[i](Response.json([]));
    await refresh;
  }
  assert.deepEqual(loadingEvents, [true, false, false]);
});

test('a stale error cannot override a newer successful refresh', async () => {
  const { hook, pending, states } = hookFixture();
  const old = hook.fetchDevices();
  const fresh = hook.fetchDevices();
  pending[1](Response.json([{ uuid: 'test', battery_level: 82 }]));
  await fresh;
  pending[0](Response.json({ error: 'old failure' }, { status: 503 }));
  await old;
  assert.equal(states[0][0].battery_level, 82);
  assert.equal(states[1], false);
});

test('a response after unmount cannot write device state', async () => {
  const { hook, pending, states, unmount } = hookFixture();
  const response = hook.fetchDevices();
  unmount();
  pending[0](Response.json([{ uuid: 'test', battery_level: 82 }]));
  await response;
  assert.equal(states[0].length, 0);
});
