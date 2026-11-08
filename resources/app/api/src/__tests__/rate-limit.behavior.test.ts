import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = '6006';
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.status === 200) return;
    } catch (err) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server timed out');
}

test('Rate Limiting Behavioral Tests', async (t) => {
  const serverProc = spawn('node', ['dist/index.js'], {
    env: { ...process.env, PORT, NODE_ENV: 'test', MERTILO_DB_PATH: ':memory:' },
    cwd: path.resolve(__dirname, '..', '..')
  });

  t.after(() => serverProc.kill());

  await waitForServer();

  await t.test('Global Rate Limit headers on endpoints', async () => {
    const resAuth = await fetch(`${BASE_URL}/api/financas`);
    assert.ok(resAuth.headers.get('x-ratelimit-limit'), 'Should have limit header');
    assert.ok(resAuth.headers.get('x-ratelimit-remaining'), 'Should have remaining header');
  });

  await t.test('Login Rate Limit - 5 requests window', async () => {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const payload = { email: 'test@example.com', password: 'wrong' };
    
    for (let i = 0; i < 5; i++) {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.notStrictEqual(res.status, 429, `Request ${i+1} should not be limited`);
    }

    const limitedRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.strictEqual(limitedRes.status, 429, '6th request should be limited');
    const body = await limitedRes.json();
    assert.strictEqual(body.error, 'Muitas tentativas de login, tente novamente em 15 minutos');
  });

  await t.test('IP Spoofing Protection and distinct counters', async () => {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const resLocal = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other@example.com', password: 'wrong' })
    });
    assert.strictEqual(resLocal.status, 429, 'Local IP should still be limited');
  });
});
