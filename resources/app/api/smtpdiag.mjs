import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const recipient = process.env.SMTP_TEST_RECIPIENT || 'onboarding@yourdomain.com';
console.log(JSON.stringify({
  hasHost: !!process.env.SMTP_HOST,
  hasPort: !!process.env.SMTP_PORT,
  hasUser: !!(process.env.SMTP_USER || process.env.SMTP_USERNAME),
  hasPass: !!(process.env.SMTP_PASS || process.env.SMTP_PASSWORD),
  hasFrom: !!(process.env.SMTP_FROM || process.env.SMTP_FROM_EMAIL),
  recipient: recipient.includes('@') ? recipient.replace(/(^.).*(@.*$)/, '$1***$2') : recipient,
}, null, 2));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER || process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: true },
});

try {
  await transporter.verify();
  console.log('VERIFY_RESULT: OK');
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_FROM_EMAIL,
    to: recipient,
    subject: 'Mertilo SMTP diagnostic',
    text: 'This is a real SMTP test message from Mertilo.',
    html: '<p>This is a real SMTP test message from Mertilo.</p>',
  });

  console.log(JSON.stringify({
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
    messageId: info.messageId,
    envelope: info.envelope,
  }, null, 2));
} catch (error) {
  console.error('SMTP_ERROR:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
