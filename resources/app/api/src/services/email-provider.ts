import nodemailer from 'nodemailer';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  fromName?: string;
};

export type EmailResult = {
  accepted?: string[];
  messageId?: string;
  provider: 'api' | 'brevo' | 'smtp' | 'mock';
  simulated?: boolean;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}

export class MockEmailProvider implements EmailProvider {
  public calls: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<EmailResult> {
    this.calls.push(message);
    return {
      accepted: [message.to],
      messageId: `mock-${Date.now()}`,
      provider: 'mock',
      simulated: true,
    };
  }
}

export class BrevoEmailProvider implements EmailProvider {
  private readonly apiKey = (process.env.BREVO_API_KEY ?? '').trim();
  private readonly fromEmail = (process.env.BREVO_FROM_EMAIL ?? '').trim();
  private readonly fromName = (process.env.BREVO_FROM_NAME ?? 'Mertilo').trim();

  isConfigured() {
    return Boolean(this.apiKey && this.fromEmail);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) throw new Error('Configuração Brevo incompleta');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html ?? message.text,
      }),
    });
    const raw = await response.text();
    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { /* preserve provider response below */ }
    if (!response.ok) throw new Error(`Falha no envio Brevo API (${response.status}): ${payload?.message ?? (raw || response.statusText)}`);
    return { accepted: [message.to], messageId: payload?.messageId ?? `brevo-${Date.now()}`, provider: 'brevo' };
  }
}

export class MailtrapEmailProvider implements EmailProvider {
  private readonly apiToken: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;
  private readonly pass: string;
  private readonly smtpFrom: string;

  constructor() {
    this.apiToken = (process.env.MAILTRAP_API_TOKEN ?? '').trim();
    this.fromEmail = (process.env.MAILTRAP_FROM_EMAIL ?? process.env.MAILTRAP_FROM ?? process.env.SMTP_FROM_EMAIL ?? '').trim();
    this.fromName = (process.env.MAILTRAP_FROM_NAME ?? 'Mertilo').trim();
    this.host = (process.env.MAILTRAP_HOST ?? process.env.SMTP_HOST ?? '').trim();
    this.port = Number(process.env.MAILTRAP_PORT ?? process.env.SMTP_PORT ?? 2525) || 2525;
    this.secure = String(process.env.MAILTRAP_SECURE ?? process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || this.port === 465;
    this.user = (process.env.MAILTRAP_USER ?? process.env.SMTP_USER ?? process.env.SMTP_USERNAME ?? '').trim();
    this.pass = (process.env.MAILTRAP_PASS ?? process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? '').trim();
    this.smtpFrom = (process.env.MAILTRAP_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_FROM_EMAIL ?? '').trim();
  }

  isApiConfigured() {
    return Boolean(this.apiToken && this.fromEmail);
  }

  isConfigured() {
    return this.isApiConfigured() || Boolean(this.host && this.user && this.pass && this.smtpFrom);
  }

  private async sendApi(message: EmailMessage): Promise<EmailResult> {
    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { email: this.fromEmail, name: this.fromName },
        to: [{ email: message.to }],
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
      }),
    });
    const raw = await response.text();
    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { /* preserve provider response below */ }
    if (!response.ok) throw new Error(`Falha no envio Mailtrap API (${response.status}): ${payload?.errors?.join?.(', ') ?? payload?.message ?? (raw || response.statusText)}`);
    return { accepted: [message.to], messageId: payload?.message_ids?.[0] ?? payload?.message_id ?? `api-${Date.now()}`, provider: 'api' };
  }

  private async sendSmtp(message: EmailMessage): Promise<EmailResult> {
    if (!this.host || !this.user || !this.pass || !this.smtpFrom) throw new Error('Configuração Mailtrap incompleta');
    const transporter = nodemailer.createTransport({ host: this.host, port: this.port, secure: this.secure, auth: { user: this.user, pass: this.pass }, tls: { rejectUnauthorized: true } });
    try {
      await transporter.verify();
      const info = await transporter.sendMail({ from: this.smtpFrom, to: message.to, subject: message.subject, text: message.text, html: message.html ?? message.text });
      return { accepted: [message.to], messageId: info.messageId ?? `smtp-${Date.now()}`, provider: 'smtp' };
    } catch (error) {
      throw new Error(`Falha no envio SMTP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (this.isApiConfigured()) return this.sendApi(message);
    return this.sendSmtp(message);
  }
}
