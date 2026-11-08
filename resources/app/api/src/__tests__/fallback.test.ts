import { test } from 'node:test';
import assert from 'node:assert';
import { emailService } from '../services/email.service.js';
import { MailtrapEmailProvider, BrevoEmailProvider, EmailError } from '../services/email-provider.js';

test('Mailtrap fallback to Brevo on DNS error', async () => {
  process.env.NODE_ENV = 'production';
  process.env.EMAIL_PROVIDER = 'hybrid';
  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_FROM_EMAIL = 'test@test.com';
  
  // Mock Mailtrap to throw DNS error
  const originalMailtrapSend = MailtrapEmailProvider.prototype.send;
  MailtrapEmailProvider.prototype.send = async () => {
    throw new EmailError('getaddrinfo ENOTFOUND send.api.mailtrap.io', 'dns', 'Mailtrap');
  };

  // Mock Brevo to succeed
  const originalBrevoSend = BrevoEmailProvider.prototype.send;
  BrevoEmailProvider.prototype.send = async (msg) => {
    return { accepted: [msg.to], messageId: 'brevo-test', provider: 'brevo' };
  };

  try {
    const result = await emailService.sendMail('test@example.com', 'Subject', 'Text');
    assert.strictEqual(result.provider, 'brevo');
  } finally {
    MailtrapEmailProvider.prototype.send = originalMailtrapSend;
    BrevoEmailProvider.prototype.send = originalBrevoSend;
    process.env.NODE_ENV = 'test';
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_FROM_EMAIL;
  }
});

test('Timeout detection on Mailtrap', async () => {
  const err = new EmailError('Timeout of 1000ms', 'timeout', 'Mailtrap');
  assert.strictEqual(err.type, 'timeout');
  assert.strictEqual(err.provider, 'Mailtrap');
});
