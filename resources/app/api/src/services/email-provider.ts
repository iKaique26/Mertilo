export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  fromName?: string;
};

import nodemailer from 'nodemailer';

export type EmailResult = {
  accepted?: string[];
  messageId?: string;
  provider: 'resend' | 'smtp' | 'mock';
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

export class SmtpEmailProvider implements EmailProvider {
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;
  private readonly pass: string;
  private readonly from: string;

  constructor() {
    this.host = (process.env.SMTP_HOST ?? '').trim();
    this.port = Number(process.env.SMTP_PORT ?? 587) || 587;
    this.secure = String(process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || this.port === 465;
    this.user = ((process.env.SMTP_USER ?? process.env.SMTP_USERNAME ?? '').trim());
    this.pass = ((process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? '').trim());
    this.from = (process.env.SMTP_FROM ?? process.env.SMTP_FROM_EMAIL ?? '').trim();
  }

  isConfigured() {
    return Boolean(this.host && this.user && this.pass && this.from);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) {
      throw new Error('SMTP não configurado');
    }

    const transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: { user: this.user, pass: this.pass },
    });

    await transporter.verify();
    const info = await transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html ?? message.text,
    });

    return {
      accepted: [message.to],
      messageId: info.messageId ?? `smtp-${Date.now()}`,
      provider: 'smtp',
    };
  }
}

export class ResendEmailProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = (process.env.RESEND_API_KEY ?? '').trim();
    this.fromEmail = (process.env.RESEND_FROM_EMAIL ?? '').trim();
    this.fromName = (process.env.RESEND_FROM_NAME ?? 'Mertilo').trim() || 'Mertilo';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.fromEmail);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) {
      throw new Error('Resend não configurado');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [message.to],
        subject: message.subject,
        html: message.html ?? message.text,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const payload = raw ? `: ${raw.slice(0, 200)}` : '';
      throw new Error(`Erro ao enviar e-mail pela Resend${payload}`);
    }

    const data = await response.json().catch(() => ({})) as any;
    return {
      accepted: [message.to],
      messageId: data.id ?? data.messageId ?? `resend-${Date.now()}`,
      provider: 'resend',
    };
  }
}
