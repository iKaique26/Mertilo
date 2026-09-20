import { logger } from '../utils/logger.js';
import { MockEmailProvider, ResendEmailProvider, SmtpEmailProvider, type EmailMessage, type EmailProvider } from './email-provider.js';

function maskEmail(email: string) {
  const normalized = (email ?? '').trim();
  if (!normalized || !normalized.includes('@')) return '***';
  const [local, domain] = normalized.split('@');
  const safeLocal = local.length <= 2 ? `${local.slice(0, 1) || '*'}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

function getStringEnv(name: string) {
  return (process.env[name] ?? '').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getProvider(): EmailProvider {
  if (process.env.NODE_ENV === 'test') return new MockEmailProvider();

  const smtpHost = getStringEnv('SMTP_HOST');
  const smtpUser = getStringEnv('SMTP_USER') || getStringEnv('SMTP_USERNAME');
  const smtpPass = getStringEnv('SMTP_PASS') || getStringEnv('SMTP_PASSWORD');
  const smtpFrom = getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL');
  if (smtpHost && smtpUser && smtpPass && smtpFrom) return new SmtpEmailProvider();

  const resendKey = getStringEnv('RESEND_API_KEY');
  const resendFrom = getStringEnv('RESEND_FROM_EMAIL');
  if (resendKey && resendFrom) return new ResendEmailProvider();

  return new MockEmailProvider();
}

export function buildVerificationEmail(code: string, expiresInMinutes = 60) {
  const safeCode = escapeHtml(code);
  const text = [
    'Confirme seu e-mail — Mertilo',
    '',
    'Olá!',
    'Uma conta foi criada com este e-mail na Mertilo.',
    'Seu código de verificação é:',
    code,
    `Este código expira em ${expiresInMinutes} minutos.`,
    'Se você não solicitou esta conta, pode ignorar este e-mail.',
    'Atenciosamente,',
    'Equipe Mertilo',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #111827;">Confirme seu e-mail — Mertilo</h2>
        <p style="margin: 0 0 12px;">Olá! Uma conta foi criada com este e-mail na Mertilo.</p>
        <p style="margin: 0 0 8px;">Seu código de verificação é:</p>
        <div style="display: inline-block; padding: 16px 20px; background: #f3f4f6; border-radius: 8px; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827; margin: 12px 0 16px;">${safeCode}</div>
        <p style="margin: 0 0 12px;">Este código expira em ${expiresInMinutes} minutos.</p>
        <p style="margin: 0 0 12px;">Se você não solicitou esta conta, pode ignorar este e-mail.</p>
        <p style="margin: 0; color: #6b7280;">Atenciosamente,<br>Equipe Mertilo</p>
      </div>
    </div>
  `;

  return { text, html };
}

export function buildPasswordResetEmail(link: string) {
  const safeLink = escapeHtml(link);
  const text = [
    'Recuperação de senha — Mertilo',
    '',
    'Olá!',
    'Recebemos uma solicitação para redefinir sua senha da Mertilo.',
    'Use o link a seguir para continuar:',
    link,
    'Se você não solicitou, pode ignorar este e-mail.',
    'Atenciosamente,',
    'Equipe Mertilo',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #111827;">Recuperação de senha — Mertilo</h2>
        <p style="margin: 0 0 12px;">Olá! Recebemos uma solicitação para redefinir sua senha da Mertilo.</p>
        <p style="margin: 0 0 12px;">Use o link a seguir para continuar:</p>
        <p style="margin: 0 0 16px;"><a href="${safeLink}" style="color: #111827; font-weight: 700; word-break: break-all;">${safeLink}</a></p>
        <p style="margin: 0 0 12px;">Se você não solicitou a redefinição, pode ignorar este e-mail.</p>
        <p style="margin: 0; color: #6b7280;">Atenciosamente,<br>Equipe Mertilo</p>
      </div>
    </div>
  `;

  return { text, html };
}

export const emailService = {
  isConfigured() {
    const smtpHost = getStringEnv('SMTP_HOST');
    const smtpUser = getStringEnv('SMTP_USER') || getStringEnv('SMTP_USERNAME');
    const smtpPass = getStringEnv('SMTP_PASS') || getStringEnv('SMTP_PASSWORD');
    const smtpFrom = getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL');
    const smtpConfigured = Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);

    if (smtpConfigured) return true;

    const resendKey = getStringEnv('RESEND_API_KEY');
    const resendFrom = getStringEnv('RESEND_FROM_EMAIL');
    return Boolean(resendKey && resendFrom);
  },

  logConfigurationStatus() {
    const smtpHost = getStringEnv('SMTP_HOST');
    const smtpUser = getStringEnv('SMTP_USER') || getStringEnv('SMTP_USERNAME');
    const smtpPass = getStringEnv('SMTP_PASS') || getStringEnv('SMTP_PASSWORD');
    const smtpFrom = getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL');

    if (smtpHost && smtpUser && smtpPass && smtpFrom) {
      logger.info('SMTP configurado e pronto para envio real de e-mails.');
      return;
    }

    if (getStringEnv('RESEND_API_KEY') && getStringEnv('RESEND_FROM_EMAIL')) {
      logger.info('Resend configurado e pronto para envio real de e-mails.');
      return;
    }

    logger.info('Nenhum provedor de e-mail configurado.');
  },

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const provider = getProvider();
    const message: EmailMessage = { to, subject, text, html };
    const providerName = provider.constructor.name;
    const smtpConfigured = Boolean(
      (getStringEnv('SMTP_HOST') && (getStringEnv('SMTP_USER') || getStringEnv('SMTP_USERNAME')) && (getStringEnv('SMTP_PASS') || getStringEnv('SMTP_PASSWORD')) && (getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL')))
    );
    const senderConfigured = smtpConfigured || Boolean(getStringEnv('RESEND_API_KEY') && getStringEnv('RESEND_FROM_EMAIL'));
    logger.info('[EMAIL] provider selected', { provider: providerName, recipient: maskEmail(to), sender: senderConfigured ? 'configured' : 'missing', subject });

    try {
      const result = await provider.send(message);
      logger.info('[EMAIL] provider accepted message', { provider: result.provider, recipient: maskEmail(to), messageId: result.messageId ?? null });
      return result;
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Erro ao enviar e-mail';
      logger.warn('[EMAIL] provider error', { provider: providerName, recipient: maskEmail(to), subject, reason: raw });
      throw new Error('Não foi possível enviar o e-mail no momento. Tente novamente.');
    }
  },

  async sendVerificationCode(to: string, code: string, expiresInMinutes = 60) {
    const emailContent = buildVerificationEmail(code, expiresInMinutes);
    return this.sendMail(to, 'Confirme seu e-mail — Mertilo', emailContent.text, emailContent.html);
  },

  async sendPasswordReset(to: string, resetLink: string) {
    const emailContent = buildPasswordResetEmail(resetLink);
    return this.sendMail(to, 'Recuperação de senha — Mertilo', emailContent.text, emailContent.html);
  }
};
