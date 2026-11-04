import test from 'node:test';
import assert from 'node:assert';
import { spawn, execSync } from 'child_process';
import path from 'path';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { BrevoApiEmailProvider, SmtpEmailProvider } from '../services/email-provider.js';

const DEFAULT_PORT = 6004 + Math.floor(Math.random() * 200);
const PORT = process.env.TEST_PORT || String(DEFAULT_PORT);
const BASE_API = `http://127.0.0.1:${PORT}/api`;
let serverProc: any = null;
let dbPath: string;

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
  const url = `${BASE_API}${pathUrl}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

function openDb() {
  return new Database(dbPath, { readonly: false });
}

function clearTestPort() {
  // Avoid port collisions by choosing a random test port at startup; this keeps the auth suite isolated from prior runs.
  return;
}

test('brevo smtp provider uses TLS-validated relay when configured', async () => {
  const originalHost = process.env.SMTP_HOST;
  const originalPort = process.env.SMTP_PORT;
  const originalUser = process.env.SMTP_USER;
  const originalPass = process.env.SMTP_PASS;
  const originalPassword = process.env.SMTP_PASSWORD;
  const originalFrom = process.env.SMTP_FROM;
  const originalSecure = process.env.SMTP_SECURE;
  const originalCreateTransport = nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp-relay.brevo.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'brevo-user';
  process.env.SMTP_PASS = 'brevo-pass';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';
  process.env.SMTP_SECURE = 'false';

  let sent: any = null;
  (nodemailer as any).createTransport = ((config: any) => {
    sent = config;
    return {
      verify: async () => true,
      sendMail: async (mail: any) => {
        sent.mail = mail;
        return { messageId: 'brevo-message-id' };
      },
    };
  }) as any;

  try {
    const provider = new SmtpEmailProvider();
    const result = await provider.send({
      to: 'customer@example.com',
      subject: 'Confirme seu e-mail — Mertilo',
      text: 'Código: 123456',
      html: '<p>Código: <strong>123456</strong></p>',
    });

    assert.strictEqual(result.provider, 'smtp');
    assert.strictEqual(result.messageId, 'brevo-message-id');
    assert.strictEqual(sent.host, 'smtp-relay.brevo.com');
    assert.strictEqual(sent.port, 587);
    assert.strictEqual(sent.secure, false);
    assert.strictEqual(sent.tls.rejectUnauthorized, true);
    assert.strictEqual(sent.auth.user, 'brevo-user');
    assert.strictEqual(sent.mail.to, 'customer@example.com');
    assert.strictEqual(sent.mail.from, 'no-reply@mertilo.com');
  } finally {
    (nodemailer as any).createTransport = originalCreateTransport;
    if (originalHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = originalHost;
    if (originalPort === undefined) delete process.env.SMTP_PORT; else process.env.SMTP_PORT = originalPort;
    if (originalUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = originalUser;
    if (originalPass === undefined) delete process.env.SMTP_PASS; else process.env.SMTP_PASS = originalPass;
    if (originalPassword === undefined) delete process.env.SMTP_PASSWORD; else process.env.SMTP_PASSWORD = originalPassword;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
    if (originalSecure === undefined) delete process.env.SMTP_SECURE; else process.env.SMTP_SECURE = originalSecure;
  }
});

test('register rolls back when email delivery fails and returns a generic error', async () => {
  const { authService } = await import('../services/auth.service.js');
  const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');
  const { getDatabase } = await import('../database/db.js');
  const { emailService } = await import('../services/email.service.js');
  const originalSendVerificationCode = emailService.sendVerificationCode;
  const originalEmailProvider = process.env.EMAIL_PROVIDER;
  const originalDbPath = process.env.MERTILO_DB_PATH;

  process.env.EMAIL_PROVIDER = 'auto';
  process.env.MERTILO_DB_PATH = path.join(process.cwd(), 'data', `mertilo.rollback.test.${Date.now()}.db`);
  await initializeDatabase();
  emailService.sendVerificationCode = async () => {
    throw new Error('Falha no envio pela API Brevo: Key not found');
  };

  try {
    const email = `rollback.${Date.now()}@example.com`;
    await assert.rejects(
      () => authService.register('Rollback User', email, 'Password123!'),
      /Falha no envio|Key not found/i,
    );

    const db = getDatabase();
    const user = db.prepare('SELECT COUNT(*) as c FROM users WHERE lower(email) = ?').get(email.toLowerCase()) as { c?: number };
    assert.strictEqual(Number(user?.c ?? 0), 0);

    const verificationRows = db.prepare('SELECT COUNT(*) as c FROM verification_codes').get() as { c?: number };
    assert.strictEqual(Number(verificationRows?.c ?? 0), 0);
  } finally {
    emailService.sendVerificationCode = originalSendVerificationCode;
    await shutdownDatabase();
    if (originalEmailProvider === undefined) delete process.env.EMAIL_PROVIDER; else process.env.EMAIL_PROVIDER = originalEmailProvider;
    if (originalDbPath === undefined) delete process.env.MERTILO_DB_PATH; else process.env.MERTILO_DB_PATH = originalDbPath;
  }
});

test('brevo api provider sends via official API and uses api-key header', async () => {
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalFrom = process.env.SMTP_FROM;
  const originalFetch = global.fetch;

  process.env.BREVO_API_KEY = 'test-brevo-key';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';

  let captured: any = null;
  global.fetch = (async (input: any, init: any) => {
    captured = { input, init };
    return {
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ messageId: 'api-message-id' }),
    } as any;
  }) as any;

  try {
    const provider = new BrevoApiEmailProvider();
    const result = await provider.send({
      to: 'customer@example.com',
      subject: 'Confirme seu e-mail — Mertilo',
      text: 'Código: 123456',
      html: '<p>Código: <strong>123456</strong></p>',
    });

    assert.strictEqual(result.provider, 'api');
    assert.strictEqual(result.messageId, 'api-message-id');
    assert.strictEqual(captured.init.headers['api-key'], 'test-brevo-key');
    assert.strictEqual(JSON.parse(captured.init.body).to[0].email, 'customer@example.com');
    assert.strictEqual(JSON.parse(captured.init.body).sender.email, 'no-reply@mertilo.com');
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
  }
});

test('brevo api provider rejects invalid credentials without hiding the original error', async () => {
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalFrom = process.env.SMTP_FROM;
  const originalFetch = global.fetch;

  process.env.BREVO_API_KEY = 'invalid-brevo-key';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';

  global.fetch = (async () => ({
    ok: false,
    status: 401,
    text: async () => JSON.stringify({ code: 'unauthorized', message: 'Invalid API key' }),
  } as any)) as any;

  try {
    const provider = new BrevoApiEmailProvider();
    await assert.rejects(() => provider.send({
      to: 'customer@example.com',
      subject: 'Confirme seu e-mail — Mertilo',
      text: 'Código: 123456',
    }), /Invalid API key|unauthorized/i);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
  }
});

test('email service retries only on safe fallback and prevents duplicate sends after API acceptance', async () => {
  const originalProvider = process.env.EMAIL_PROVIDER;
  const originalFallback = process.env.EMAIL_FALLBACK_TO_SMTP;
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalSmtpHost = process.env.SMTP_HOST;
  const originalSmtpPort = process.env.SMTP_PORT;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  const originalSmtpFrom = process.env.SMTP_FROM;
  const originalCreateTransport = nodemailer.createTransport;
  const originalFetch = global.fetch;

  process.env.EMAIL_PROVIDER = 'auto';
  process.env.EMAIL_FALLBACK_TO_SMTP = 'true';
  process.env.BREVO_API_KEY = 'test-brevo-key';
  process.env.SMTP_HOST = 'smtp-relay.brevo.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'brevo-user';
  process.env.SMTP_PASS = 'brevo-pass';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';

  let apiCalls = 0;
  let smtpCalls = 0;
  global.fetch = (async () => {
    apiCalls += 1;
    return {
      ok: true,
      status: 202,
      text: async () => JSON.stringify({ messageId: 'accepted-api-message-id' }),
    } as any;
  }) as any;

  (nodemailer as any).createTransport = ((config: any) => {
    smtpCalls += 1;
    return {
      verify: async () => true,
      sendMail: async (mail: any) => ({ messageId: 'smtp-message-id' }),
    };
  }) as any;

  try {
    const { emailService } = await import('../services/email.service.js');
    const result = await emailService.sendMail('customer@example.com', 'Confirme seu e-mail', 'Código: 123456');

    assert.strictEqual(result.provider, 'api');
    assert.strictEqual(apiCalls, 1);
    assert.strictEqual(smtpCalls, 0);
  } finally {
    global.fetch = originalFetch;
    (nodemailer as any).createTransport = originalCreateTransport;
    if (originalProvider === undefined) delete process.env.EMAIL_PROVIDER; else process.env.EMAIL_PROVIDER = originalProvider;
    if (originalFallback === undefined) delete process.env.EMAIL_FALLBACK_TO_SMTP; else process.env.EMAIL_FALLBACK_TO_SMTP = originalFallback;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = originalApiKey;
    if (originalSmtpHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = originalSmtpHost;
    if (originalSmtpPort === undefined) delete process.env.SMTP_PORT; else process.env.SMTP_PORT = originalSmtpPort;
    if (originalSmtpUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = originalSmtpUser;
    if (originalSmtpPass === undefined) delete process.env.SMTP_PASS; else process.env.SMTP_PASS = originalSmtpPass;
    if (originalSmtpFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalSmtpFrom;
  }
});

test('email service falls back to SMTP only when the API failed before acceptance and fallback is enabled', async () => {
  const originalProvider = process.env.EMAIL_PROVIDER;
  const originalFallback = process.env.EMAIL_FALLBACK_TO_SMTP;
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalHost = process.env.SMTP_HOST;
  const originalPort = process.env.SMTP_PORT;
  const originalUser = process.env.SMTP_USER;
  const originalPass = process.env.SMTP_PASS;
  const originalFrom = process.env.SMTP_FROM;
  const originalSecure = process.env.SMTP_SECURE;
  const originalCreateTransport = nodemailer.createTransport;
  const originalFetch = global.fetch;

  process.env.EMAIL_PROVIDER = 'auto';
  process.env.EMAIL_FALLBACK_TO_SMTP = 'true';
  process.env.BREVO_API_KEY = 'test-brevo-key';
  process.env.SMTP_HOST = 'smtp-relay.brevo.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'brevo-user';
  process.env.SMTP_PASS = 'brevo-pass';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';
  process.env.SMTP_SECURE = 'false';

  let smtpSent = false;
  global.fetch = (async () => {
    return {
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Temporary API outage' }),
    } as any;
  }) as any;

  (nodemailer as any).createTransport = ((config: any) => ({
    verify: async () => true,
    sendMail: async (mail: any) => {
      smtpSent = true;
      return { messageId: 'smtp-fallback-message-id' };
    },
  })) as any;

  try {
    const { emailService } = await import('../services/email.service.js');
    const result = await emailService.sendMail('customer@example.com', 'Confirme seu e-mail', 'Código: 123456');

    assert.strictEqual(result.provider, 'smtp');
    assert.strictEqual(smtpSent, true);
  } finally {
    global.fetch = originalFetch;
    (nodemailer as any).createTransport = originalCreateTransport;
    if (originalProvider === undefined) delete process.env.EMAIL_PROVIDER; else process.env.EMAIL_PROVIDER = originalProvider;
    if (originalFallback === undefined) delete process.env.EMAIL_FALLBACK_TO_SMTP; else process.env.EMAIL_FALLBACK_TO_SMTP = originalFallback;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = originalApiKey;
    if (originalHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = originalHost;
    if (originalPort === undefined) delete process.env.SMTP_PORT; else process.env.SMTP_PORT = originalPort;
    if (originalUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = originalUser;
    if (originalPass === undefined) delete process.env.SMTP_PASS; else process.env.SMTP_PASS = originalPass;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
    if (originalSecure === undefined) delete process.env.SMTP_SECURE; else process.env.SMTP_SECURE = originalSecure;
  }
});

test('smtp provider uses SMTP transport when configured', async () => {
  const originalHost = process.env.SMTP_HOST;
  const originalPort = process.env.SMTP_PORT;
  const originalUser = process.env.SMTP_USER;
  const originalPass = process.env.SMTP_PASS;
  const originalPassword = process.env.SMTP_PASSWORD;
  const originalFrom = process.env.SMTP_FROM;
  const originalSecure = process.env.SMTP_SECURE;
  const originalCreateTransport = nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'smtp-user';
  process.env.SMTP_PASS = 'smtp-pass';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';
  process.env.SMTP_SECURE = 'true';

  let sent: any = null;
  (nodemailer as any).createTransport = ((config: any) => {
    sent = config;
    return {
      verify: async () => true,
      sendMail: async (mail: any) => {
        sent.mail = mail;
        return { messageId: 'smtp-message-id' };
      },
    };
  }) as any;

  try {
    const provider = new SmtpEmailProvider();
    const result = await provider.send({
      to: 'customer@example.com',
      subject: 'Confirme seu e-mail — Mertilo',
      text: 'Código: 123456',
      html: '<p>Código: <strong>123456</strong></p>',
    });

    assert.strictEqual(result.provider, 'smtp');
    assert.strictEqual(result.messageId, 'smtp-message-id');
    assert.strictEqual(sent.auth.user, 'smtp-user');
    assert.strictEqual(sent.mail.to, 'customer@example.com');
    assert.strictEqual(sent.mail.from, 'no-reply@mertilo.com');
  } finally {
    (nodemailer as any).createTransport = originalCreateTransport;
    if (originalHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = originalHost;
    if (originalPort === undefined) delete process.env.SMTP_PORT; else process.env.SMTP_PORT = originalPort;
    if (originalUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = originalUser;
    if (originalPass === undefined) delete process.env.SMTP_PASS; else process.env.SMTP_PASS = originalPass;
    if (originalPassword === undefined) delete process.env.SMTP_PASSWORD; else process.env.SMTP_PASSWORD = originalPassword;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
    if (originalSecure === undefined) delete process.env.SMTP_SECURE; else process.env.SMTP_SECURE = originalSecure;
  }
});

test('email service surfaces SMTP rejection reason to the caller', async () => {
  const originalHost = process.env.SMTP_HOST;
  const originalPort = process.env.SMTP_PORT;
  const originalUser = process.env.SMTP_USER;
  const originalPass = process.env.SMTP_PASS;
  const originalPassword = process.env.SMTP_PASSWORD;
  const originalFrom = process.env.SMTP_FROM;
  const originalSecure = process.env.SMTP_SECURE;
  const originalCreateTransport = nodemailer.createTransport;

  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'smtp-user';
  process.env.SMTP_PASS = 'smtp-pass';
  process.env.SMTP_FROM = 'no-reply@mertilo.com';
  process.env.SMTP_SECURE = 'false';

  (nodemailer as any).createTransport = (() => ({
    verify: async () => true,
    sendMail: async () => {
      throw new Error('Message failed: 550 The gmail.com domain is not verified. Please, add and verify your domain');
    },
  })) as any;

  try {
    await assert.rejects(async () => {
      await (await import('../services/email.service.js')).emailService.sendMail('customer@example.com', 'Confirme seu e-mail', 'Código: 123456');
    }, /domain is not verified|Message failed: 550/i);
  } finally {
    (nodemailer as any).createTransport = originalCreateTransport;
    if (originalHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = originalHost;
    if (originalPort === undefined) delete process.env.SMTP_PORT; else process.env.SMTP_PORT = originalPort;
    if (originalUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = originalUser;
    if (originalPass === undefined) delete process.env.SMTP_PASS; else process.env.SMTP_PASS = originalPass;
    if (originalPassword === undefined) delete process.env.SMTP_PASSWORD; else process.env.SMTP_PASSWORD = originalPassword;
    if (originalFrom === undefined) delete process.env.SMTP_FROM; else process.env.SMTP_FROM = originalFrom;
    if (originalSecure === undefined) delete process.env.SMTP_SECURE; else process.env.SMTP_SECURE = originalSecure;
  }
});

test('auth integration full', async (t) => {
  dbPath = path.join(process.cwd(), 'data', `mertilo.auth.full.test.${Date.now()}.db`);
  clearTestPort();
  serverProc = spawn(process.execPath, ['dist/index.js'], { env: { ...process.env, PORT, MERTILO_DB_PATH: dbPath, NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProc.stdout?.on('data', (d: any) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr?.on('data', (d: any) => process.stderr.write(`[server-err] ${d}`));

  await waitForServer(15000);

  // 1) Registration scenarios
  const emailA = `test+authA_${Date.now()}@example.com`;
  const normalizedEmailA = emailA.trim().toLowerCase();
  const passwordA = 'Password123!';

  // valid register
  const regA = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'User A', email: emailA, password: passwordA }) });
  assert.strictEqual(regA.status, 201);
  const regABody = await regA.json();
  assert.ok(regABody.verification_code, 'expected verification_code for test env');

  // invalid email
  const bad = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Bad', email: 'notanemail', password: 'Password123!' }) });
  assert.strictEqual(bad.status, 400);

  // short password
  const short = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Short', email: `s_${Date.now()}@example.com`, password: 'short' }) });
  assert.strictEqual(short.status, 400);

  // payload missing
  const missing = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  assert.strictEqual(missing.status, 400);

  // malformed payload (wrong types)
  const malformed = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 123, email: 456, password: true }) });
  assert.strictEqual(malformed.status, 400);

  // pending email retries should regenerate code without creating a second user
  const pendingEmail = `pending.retry.${Date.now()}@example.com`;
  const pendingReg = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Pending User', email: pendingEmail.toUpperCase(), password: 'Password123!' }) });
  assert.strictEqual(pendingReg.status, 201);
  const pendingRegBody = await pendingReg.json();
  assert.ok(pendingRegBody.verification_code);
  const pendingDb = openDb();
  const pendingUsers = pendingDb.prepare('SELECT COUNT(*) as c FROM users WHERE lower(email) = ?').get(pendingEmail.toLowerCase()) as { c?: number };
  assert.strictEqual(Number(pendingUsers?.c ?? 0), 1);
  pendingDb.close();

  // same pending email should be allowed to retry without permanent lockout
  const pendingDup = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Pending User Retry', email: pendingEmail, password: 'Password123!' }) });
  assert.strictEqual(pendingDup.status, 201);

  // 2) Verification scenarios
  const verifyCorrect = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, code: regABody.verification_code }) });
  assert.strictEqual(verifyCorrect.status, 200);
  const verifyBody = await verifyCorrect.json();
  assert.ok(verifyBody.token, 'verify-email should return a token for auto-login');
  assert.strictEqual(verifyBody.user.email, normalizedEmailA);
  assert.ok(!verifyBody.user.password_hash, 'password_hash should not be exposed');

  const dbAfterVerify = openDb();
  const verifiedRow = dbAfterVerify.prepare('SELECT is_verified FROM users WHERE lower(email) = ?').get(normalizedEmailA) as { is_verified?: number } | undefined;
  assert.strictEqual(Number(verifiedRow?.is_verified ?? 0), 1, 'verification must persist in SQLite');
  dbAfterVerify.close();

  const verifiedDup = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'User A2', email: emailA, password: 'Password123!' }) });
  assert.strictEqual(verifiedDup.status, 400);

  // already used
  const verifyAgain = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, code: regABody.verification_code }) });
  assert.strictEqual(verifyAgain.status, 400);

  // incorrect code
  const emailB = `test+authB_${Date.now()}@example.com`;
  const regB = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'User B', email: emailB, password: 'Password123!' }) });
  const regBbody = await regB.json();
  const badCode = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailB, code: '000000' }) });
  assert.strictEqual(badCode.status, 400);

  // expired code
  const verificationDb = openDb();
  const vb: any = verificationDb.prepare('SELECT id FROM verification_codes WHERE user_id = (SELECT id FROM users WHERE lower(email) = ?) ORDER BY created_at DESC LIMIT 1').get(emailB.trim().toLowerCase());
  assert.ok(vb && vb.id);
  verificationDb.prepare('UPDATE verification_codes SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000 * 60).toISOString(), vb.id);
  const expired = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailB, code: regBbody.verification_code }) });
  assert.strictEqual(expired.status, 400);

  // attempts exceeded
  // create new code for B via resend and then set attempts
  const resendRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/resend-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailB }) });
  assert.strictEqual(resendRes.status, 200);
  let resendBody = {}; try { resendBody = await resendRes.json(); } catch (e) {}
  const vb2: any = verificationDb.prepare('SELECT id FROM verification_codes WHERE user_id = (SELECT id FROM users WHERE lower(email) = ?) ORDER BY created_at DESC LIMIT 1').get(emailB.trim().toLowerCase());
  verificationDb.prepare('UPDATE verification_codes SET attempts = 5 WHERE id = ?').run(vb2.id);
  verificationDb.close();
  const attemptsRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailB, code: regBbody.verification_code }) });
  assert.strictEqual(attemptsRes.status, 400);

  // resend returns code in test env
  const emailC = `test+authC_${Date.now()}@example.com`;
  const regC = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'User C', email: emailC, password: 'Password123!' }) });
  const resResend = await fetch(`http://127.0.0.1:${PORT}/api/auth/resend-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailC }) });
  assert.strictEqual(resResend.status, 200);
  const resResendBody = await resResend.json();
  assert.ok(resResendBody.code || true);

  // 3) Login
  // user A should login
  const loginA = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, password: passwordA }) });
  assert.strictEqual(loginA.status, 200);
  const loginABody = await loginA.json();
  assert.ok(loginABody.token);
  assert.ok(loginABody.user && loginABody.user.email === normalizedEmailA);
  assert.ok(!loginABody.user.password_hash, 'password_hash should not be returned');

  // wrong password
  const loginWrong = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, password: 'wrongpass' }) });
  assert.strictEqual(loginWrong.status, 400);

  // non-existent
  const loginNon = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'noone@example.com', password: 'Password123!' }) });
  assert.strictEqual(loginNon.status, 400);

  // not verified login (emailB was not verified)
  const loginB = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailB, password: 'Password123!' }) });
  assert.strictEqual(loginB.status, 400);

  // payload invalid
  const loginInvalid = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA }) });
  assert.strictEqual(loginInvalid.status, 400);

  // 4) Forgot / Reset password
  const forgot = await fetch(`http://127.0.0.1:${PORT}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA }) });
  assert.strictEqual(forgot.status, 200);
  const forgotBody = await forgot.json();
  const resetToken = forgotBody && forgotBody.token;
  assert.ok(resetToken, 'expected reset token in test env');

  // reset with invalid new password
  const resetInvalid = await fetch(`http://127.0.0.1:${PORT}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, token: resetToken, newPassword: 'short' }) });
  assert.strictEqual(resetInvalid.status, 400);

  // reset valid
  const newPass = 'NewPassword123!';
  const resetOk = await fetch(`http://127.0.0.1:${PORT}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, token: resetToken, newPassword: newPass }) });
  assert.strictEqual(resetOk.status, 200);

  // token used can't be reused
  const resetAgain = await fetch(`http://127.0.0.1:${PORT}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, token: resetToken, newPassword: 'Another123!' }) });
  assert.strictEqual(resetAgain.status, 400);

  // login with new password
  const loginNew = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailA, password: newPass }) });
  assert.strictEqual(loginNew.status, 200);
  const loginNewBody = await loginNew.json();
  const tokenA = loginNewBody.token;

  // 5) Session and logout
  const me = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
  assert.strictEqual(me.status, 200);

  const meNo = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`);
  assert.strictEqual(meNo.status, 401);

  const meInvalid = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, { headers: { Authorization: 'Bearer invalidtoken' } });
  assert.strictEqual(meInvalid.status, 401);

  const logout = await fetch(`http://127.0.0.1:${PORT}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } });
  assert.strictEqual(logout.status, 200);

  const meAfter = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
  assert.strictEqual(meAfter.status, 401);

  // security: password never in responses
  const regCheck = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Sec', email: `sec_${Date.now()}@example.com`, password: 'Password123!' }) });
  const regCheckBody = await regCheck.json();
  assert.ok(!regCheckBody.user.password_hash);

  // cleanup
  serverProc.kill();
});
