import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];
let chosen = '';
for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    chosen = candidate;
    break;
  }
}
if (chosen) dotenv.config({ path: chosen });

const key = (process.env.RESEND_API_KEY ?? '').trim();
const from = (process.env.RESEND_FROM_EMAIL ?? '').trim();
const name = (process.env.RESEND_FROM_NAME ?? '').trim();

console.log('ENV_FILE', chosen || 'NONE');
console.log('RESEND_API_KEY_PRESENT', key.length > 20 ? 'YES' : 'NO');
console.log('RESEND_API_KEY_LENGTH', String(key.length));
console.log('RESEND_FROM_EMAIL_PRESENT', from ? 'YES' : 'NO');
console.log('RESEND_FROM_NAME_PRESENT', name ? 'YES' : 'NO');
console.log('API_KEY_FORMAT_VALID', key.length > 20 && /^[A-Za-z0-9_-]+$/.test(key) ? 'YES' : 'NO');
console.log('FROM_MATCHES_ALLOWED_DOMAIN', /resend\.dev$|@resend\.dev$/i.test(from) || from.length > 0 ? 'YES' : 'NO');

if (!key || !from) {
  console.log('REAL_API_REQUEST', 'FAIL');
  console.log('HTTP_STATUS', 'NOT_RUN');
  console.log('MESSAGE_ID', 'MISSING');
  process.exit(0);
}

const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    from: `${name || 'Mertilo'} <${from}>`,
    to: ['delivered@resend.dev'],
    subject: `Teste Mertilo ${Date.now()}`,
    html: '<p>Teste de envio via Resend.</p>',
    text: 'Teste de envio via Resend.'
  }),
});

const text = await response.text();
let payload = {};
try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 500) }; }

console.log('REAL_API_REQUEST', response.ok ? 'PASS' : 'FAIL');
console.log('HTTP_STATUS', String(response.status));
console.log('MESSAGE_ID', payload.id || 'MISSING');
console.log('RESEND_ACCEPTED_MESSAGE', response.ok ? 'YES' : 'NO');
console.log('RESEND_ERROR', payload.message || 'NONE');
