import { logger } from '../utils/logger.js';
import { BrevoApiEmailProvider, MockEmailProvider, SmtpEmailProvider, type EmailMessage, type EmailProvider } from './email-provider.js';

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

function getBooleanEnv(name: string) {
  const value = (process.env[name] ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isBrevoApiConfigured() {
  const apiKey = getStringEnv('BREVO_API_KEY');
  const sender = getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL');
  return Boolean(apiKey && sender);
}

function isSmtpConfigured() {
  const smtpHost = getStringEnv('SMTP_HOST');
  const smtpUser = getStringEnv('SMTP_USER') || getStringEnv('SMTP_USERNAME');
  const smtpPass = getStringEnv('SMTP_PASS') || getStringEnv('SMTP_PASSWORD');
  const smtpFrom = getStringEnv('SMTP_FROM') || getStringEnv('SMTP_FROM_EMAIL');
  return Boolean(smtpHost && smtpUser && smtpPass && smtpFrom);
}

function getProviderPreference(): 'auto' | 'brevo-api' | 'smtp' | 'mock' {
  const value = (process.env.EMAIL_PROVIDER ?? 'auto').trim().toLowerCase();
  if (value === 'brevo-api' || value === 'brevoapi') return 'brevo-api';
  if (value === 'smtp') return 'smtp';
  if (value === 'mock') return 'mock';
  return 'auto';
}

function isFallbackToSmtpEnabled() {
  return getBooleanEnv('EMAIL_FALLBACK_TO_SMTP');
}

function getProviderChain(): EmailProvider[] {
  if (process.env.NODE_ENV === 'test') return [new MockEmailProvider()];

  const preferred = getProviderPreference();
  const providers: EmailProvider[] = [];

  if (preferred === 'mock') return [new MockEmailProvider()];

  if (preferred === 'brevo-api') {
    if (isBrevoApiConfigured()) return [new BrevoApiEmailProvider()];
    throw new Error('Configuração da API Brevo incompleta. Defina BREVO_API_KEY e SMTP_FROM antes de enviar e-mails.');
  }

  if (preferred === 'smtp') {
    if (isSmtpConfigured()) return [new SmtpEmailProvider()];
    throw new Error('Configuração SMTP do Brevo incompleta. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM antes de enviar e-mails.');
  }

  if (isBrevoApiConfigured()) providers.push(new BrevoApiEmailProvider());
  if (isSmtpConfigured()) providers.push(new SmtpEmailProvider());

  if (providers.length === 0) {
    throw new Error('Nenhum provedor de e-mail configurado. Defina BREVO_API_KEY ou SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM.');
  }

  return providers;
}

function shouldTryFallbackToSmtp(primaryProvider: EmailProvider, error: unknown): boolean {
  if (!isFallbackToSmtpEnabled() || !isSmtpConfigured()) return false;
  if (!(primaryProvider instanceof BrevoApiEmailProvider)) return false;

  const reason = error instanceof Error ? error.message : String(error);
  const message = reason.toLowerCase();
  if (message.includes('accepted') || message.includes('already sent') || message.includes('duplicate')) return false;
  return true;
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
    return isBrevoApiConfigured() || isSmtpConfigured();
  },

  logConfigurationStatus() {
    if (isBrevoApiConfigured()) {
      logger.info('API do Brevo configurada e pronta para envio real de e-mails.');
      return;
    }

    if (isSmtpConfigured()) {
      logger.info('SMTP do Brevo configurado e pronto para envio real de e-mails.');
      return;
    }

    logger.warn('Configuração de e-mail do Brevo incompleta. Defina BREVO_API_KEY ou SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM antes de enviar e-mails.');
  },

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const providers = getProviderChain();
    const message: EmailMessage = { to, subject, text, html };
    let lastError: unknown = null;

    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      const providerName = provider.constructor.name;
      const smtpConfigured = isSmtpConfigured();
      logger.info('[EMAIL] provider selected', { provider: providerName, recipient: maskEmail(to), sender: smtpConfigured ? 'configured' : 'missing', subject });

      try {
        const result = await provider.send(message);
        logger.info('[EMAIL] provider accepted message', { provider: result.provider, recipient: maskEmail(to), messageId: result.messageId ?? null });
        return result;
      } catch (error) {
        lastError = error;
        const raw = error instanceof Error ? error.message : 'Erro ao enviar e-mail';
        logger.warn('[EMAIL] provider error', { provider: providerName, recipient: maskEmail(to), subject, reason: raw });

        const canFallback = index === 0 && shouldTryFallbackToSmtp(provider, error) && providers.some((candidate) => candidate instanceof SmtpEmailProvider);
        if (canFallback) {
          logger.warn('[EMAIL] attempting fallback provider after primary failure', { primary: providerName, alternate: 'SmtpEmailProvider', recipient: maskEmail(to) });
          continue;
        }

        throw error;
      }
    }

    const raw = lastError instanceof Error ? lastError.message : 'Erro ao enviar e-mail';
    throw new Error(`Não foi possível enviar o e-mail no momento. Motivo do provedor: ${raw}`);
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
