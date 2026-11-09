import { logger } from '../utils/logger.js';
import { BrevoEmailProvider, MailtrapEmailProvider, MockEmailProvider, type EmailMessage, type EmailProvider } from './email-provider.js';

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

function isMailtrapConfigured() {
  const apiToken = getStringEnv('MAILTRAP_API_TOKEN');
  const fromEmail = getStringEnv('MAILTRAP_FROM_EMAIL') || getStringEnv('MAILTRAP_FROM') || getStringEnv('SMTP_FROM_EMAIL');
  if (apiToken && fromEmail) return true;
  const host = getStringEnv('MAILTRAP_HOST') || getStringEnv('SMTP_HOST');
  const user = getStringEnv('MAILTRAP_USER') || getStringEnv('SMTP_USER');
  const pass = getStringEnv('MAILTRAP_PASS') || getStringEnv('SMTP_PASS');
  return Boolean(host && user && pass && fromEmail);
}

function getProviderPreference(): 'mailtrap' | 'brevo' | 'hybrid' | 'mock' {
  if (process.env.NODE_ENV === 'test') return 'mock';
  const value = (process.env.EMAIL_PROVIDER ?? 'mock').trim().toLowerCase();
  return value === 'mailtrap' || value === 'brevo' || value === 'hybrid' ? value : 'mock';
}

function isLocalDevelopment() {
  return process.env.NODE_ENV !== 'production';
}

function getProviderChain(preferBrevo = false): EmailProvider[] {
  const preference = getProviderPreference();
  if (process.env.NODE_ENV === 'test') return [new MockEmailProvider()];
  
  const mailtrap = new MailtrapEmailProvider();
  const brevo = new BrevoEmailProvider();
  
  const mailtrapReady = mailtrap.isConfigured();
  const brevoReady = brevo.isConfigured();

  if (preferBrevo && brevoReady) {
    return brevoReady && mailtrapReady ? [brevo, mailtrap] : (brevoReady ? [brevo] : [new MockEmailProvider()]);
  }

  if (preference === 'mailtrap') {
    return mailtrapReady ? [mailtrap, ...(brevoReady ? [brevo] : [])] : [new MockEmailProvider()];
  }
  if (preference === 'brevo') {
    return brevoReady ? [brevo, ...(mailtrapReady ? [mailtrap] : [])] : [new MockEmailProvider()];
  }
  if (preference === 'hybrid') {
    return mailtrapReady && brevoReady ? [mailtrap, brevo] : (mailtrapReady ? [mailtrap] : (brevoReady ? [brevo] : [new MockEmailProvider()]));
  }
  
  // Default fallback order: Mailtrap first, Brevo second if configured
  return mailtrapReady && brevoReady ? [mailtrap, brevo] : (mailtrapReady ? [mailtrap] : (brevoReady ? [brevo] : [new MockEmailProvider()]));
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
    'Redefinição de senha — Mertilo',
    '',
    'Olá!',
    'Recebemos uma solicitação para redefinir sua senha da Mertilo.',
    'Use o link a seguir para criar uma nova senha:',
    link,
    'Este link expira em 30 minutos e pode ser usado apenas uma vez.',
    'Se você não solicitou a redefinição, pode ignorar este e-mail.',
    'Atenciosamente,',
    'Equipe Mertilo',
  ].join('\n');

  const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6;">
      <div style="max-width: 560px; margin: 0 auto; padding: 40px 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #22d3ee); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style="font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">Mertilo</span>
          </div>
        </div>
        
        <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 700; text-align: center;">Redefinição de senha</h2>
        <p style="margin: 0 0 24px; color: #475569; font-size: 16px; text-align: center;">Recebemos uma solicitação para redefinir sua senha da Mertilo.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${safeLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #ffffff; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
            Criar nova senha
          </a>
        </div>
        
        <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; text-align: center;">Ou copie e cole este link no seu navegador:</p>
        <p style="margin: 0 0 24px; color: #8b5cf6; font-size: 13px; text-align: center; word-break: break-all; font-family: monospace;">${safeLink}</p>
        
        <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 13px;"><strong>Informações importantes:</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px;">
            <li>Este link expira em <strong>30 minutos</strong>.</li>
            <li>O link pode ser usado <strong>apenas uma vez</strong>.</li>
            <li>Se você não solicitou esta redefinição, pode ignorar este e-mail com segurança.</li>
          </ul>
        </div>
        
        <p style="margin: 24px 0 0; color: #94a3b8; font-size: 13px; text-align: center;">Atenciosamente,<br>Equipe Mertilo</p>
      </div>
    </div>
  `;

  return { text, html };
}

export const emailService = {
  isConfigured() {
    return isMailtrapConfigured() || getProviderPreference() === 'mock';
  },

  logConfigurationStatus() {
    console.log('[EMAIL] configuração carregada', { provider: getProviderPreference(), mailtrapConfigured: isMailtrapConfigured(), brevoConfigured: Boolean(getStringEnv('BREVO_API_KEY') && getStringEnv('BREVO_FROM_EMAIL')) });
    if (isMailtrapConfigured()) {
      logger.info('Mailtrap configurado e pronto para envio real de e-mails.');
      return;
    }
    logger.warn('Mailtrap não configurado. Testes locais usam MockEmailProvider. Defina MAILTRAP_API_TOKEN e MAILTRAP_FROM_EMAIL.');
  },

  async diagnose() {
    const brevo = new BrevoEmailProvider();
    const mailtrap = new MailtrapEmailProvider();
    const [brevoResult, mailtrapResult] = await Promise.all([brevo.diagnose(), mailtrap.diagnose()]);
    const ok = brevoResult.status !== null && brevoResult.status >= 200 && brevoResult.status < 300 || mailtrapResult.status !== null && mailtrapResult.status >= 200 && mailtrapResult.status < 300;
    console.log('[EMAIL] diagnóstico', { ok, brevo: brevoResult, mailtrap: mailtrapResult });
    return { ok, provider: getProviderPreference(), 'Mailtrap Configurado': mailtrapResult.configured, 'Brevo Configurado': brevoResult.configured, mailtrap: mailtrapResult, brevo: brevoResult };
  },

  async sendMail(to: string, subject: string, text: string, html?: string, preferBrevo = false) {
    console.log('[EMAIL] tentativa de envio', { to: maskEmail(to), subject, preferBrevo });
    const providers = getProviderChain(preferBrevo);
    const message: EmailMessage = { to, subject, text, html };
    let lastError: unknown = null;

    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      const providerName = provider.constructor.name;
      logger.info('[EMAIL] provider selected', { provider: providerName, recipient: maskEmail(to), subject });

      try {
        const result = await provider.send(message);
        logger.info('[EMAIL] provider accepted message', { provider: result.provider, recipient: maskEmail(to), messageId: result.messageId ?? null });
        return result;
      } catch (error) {
        lastError = error;
        const raw = error instanceof Error ? error.message : 'Erro ao enviar e-mail';
        logger.warn('[EMAIL] provider error', { provider: providerName, recipient: maskEmail(to), subject, reason: raw });
        if (index < providers.length - 1) continue;
        throw error;
      }
    }

    const raw = lastError instanceof Error ? lastError.message : 'Erro ao enviar e-mail';
    throw new Error(`Não foi possível enviar o e-mail no momento. Motivo do provedor: ${raw}`);
    throw new Error(`Não foi possível enviar o e-mail no momento. Motivo do provedor: ${raw}`);
  },

  async sendVerificationCode(to: string, code: string, expiresInMinutes = 60, preferBrevo = false) {
    const emailContent = buildVerificationEmail(code, expiresInMinutes);
    return this.sendMail(to, 'Confirme seu e-mail — Mertilo', emailContent.text, emailContent.html, preferBrevo);
  },

  async sendPasswordReset(to: string, resetLink: string, preferBrevo = false) {
    const emailContent = buildPasswordResetEmail(resetLink);
    return this.sendMail(to, 'Recuperação de senha — Mertilo', emailContent.text, emailContent.html, preferBrevo);
  }
};
