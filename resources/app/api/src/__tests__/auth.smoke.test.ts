import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'path';

async function getFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}

let PORT = '6003';
let serverProc: any = null;

async function waitForServer(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.status < 500) return;
    } catch (err) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server not ready');
}

async function api(pathUrl: string, opts: any = {}) {
  const url = `http://127.0.0.1:${PORT}/api${pathUrl}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

async function waitForFile(filePath: string, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fs.existsSync(filePath)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for email capture file: ${filePath}`);
}

let token: string | null = null;
let email: string;
let password = 'Password123!';

test('auth smoke', async (t) => {
  PORT = String(await getFreePort());
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-auth-smoke-'));
  const testDb = path.join(tempDir, 'mertilo.auth.test.db');
  const emailCapture = path.join(tempDir, 'mertilo.auth.email.json');
  serverProc = spawn(process.execPath, ['dist/index.js'], { env: { ...process.env, PORT, MERTILO_DB_PATH: testDb, MERTILO_DATA_DIR: tempDir, MERTILO_TEST_EMAIL_FILE: emailCapture, NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => {
    const proc = serverProc;
    serverProc = null;
    if (proc && proc.exitCode === null) {
      await new Promise<void>((resolve) => {
        proc.once('exit', () => resolve());
        proc.kill();
        setTimeout(resolve, 5000).unref();
      });
    }
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
  serverProc.stdout?.on('data', (d: any) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr?.on('data', (d: any) => process.stderr.write(`[server-err] ${d}`));

  await waitForServer(10000);

  email = `test+auth_${Date.now()}@example.com`;

  // registro 
  const reg = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Auth Test', email, password, acceptTerms: true, dateOfBirth: '1990-01-01' }) });
  assert.strictEqual(reg.status, 201);
  const regBody = await reg.json();
  const verificationCode = regBody.verification_code;
  assert.ok(verificationCode, 'Expected verification_code in test env');

  // verify
  const vres = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: verificationCode }) });
  assert.strictEqual(vres.status, 200);

  // login
  const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  assert.strictEqual(loginRes.status, 200);
  const loginBody = await loginRes.json();
  token = loginBody.token;
  assert.ok(token);

  // me
  const me = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.strictEqual(me.status, 200);

  // logout
  const logout = await fetch(`http://127.0.0.1:${PORT}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  assert.strictEqual(logout.status, 200);

  // me after logout should be 401
  const me2 = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.strictEqual(me2.status, 401);

  // forgot password (should return token in test env)
  const forgot = await fetch(`http://127.0.0.1:${PORT}/api/auth/forgot-password`, { 
    method: 'POST', 
    headers: {
       'Content-Type': 
       'application/json' },
        body: JSON.stringify({ email }) });
  assert.strictEqual(forgot.status, 200);
  const forgotBody = await forgot.json();
  assert.deepStrictEqual(forgotBody, { success: true });
  await waitForFile(emailCapture);
  const emailMessage = JSON.parse(fs.readFileSync(emailCapture, 'utf8'));
  const resetToken = emailMessage.text.match(/Reset-password\/([a-f0-9]{64})/)?.[1];
  assert.ok(resetToken, 'Expected reset token in simulated email');

  // reset password
  const newPassword = 'NewPass123!';
  const reset = await fetch(`http://127.0.0.1:${PORT}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, token: resetToken, newPassword }) });
  assert.strictEqual(reset.status, 200);

  // login with new password
  const login2 = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: newPassword }) });
  assert.strictEqual(login2.status, 200);

  // stop server
  await new Promise<void>((resolve, reject) => {
    const proc = serverProc;
    if (!proc || proc.exitCode !== null) return resolve();
    proc.once('error', reject);
    proc.once('exit', () => resolve());
    proc.kill('SIGTERM');
  });
});
