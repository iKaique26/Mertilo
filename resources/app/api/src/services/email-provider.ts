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
  provider: 'api' | 'smtp' | 'mock';
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

export class BrevoApiEmailProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly from: string;

  constructor() {
    this.apiKey = (process.env.BREVO_API_KEY ?? '').trim();
    this.from = (process.env.SMTP_FROM ?? process.env.SMTP_FROM_EMAIL ?? '').trim();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.from);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) {
      throw new Error('Configuração da API Brevo incompleta');
    }

    const payload = {
      sender: {
        name: 'Mertilo',
        email: this.from,
      },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html ?? message.text,
      textContent: message.text,
    };

    let response: Response;
    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha de rede na API Brevo: ${reason}`);
    }

    let parsed: any = null;
    const rawText = await response.text();
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { raw: rawText };
      }
    }

    if (!response.ok) {
      const reason = parsed?.message ?? parsed?.code ?? (rawText || `HTTP ${response.status}`);
      throw new Error(`Falha no envio pela API Brevo: ${reason}`);
    }

    const messageId = parsed?.messageId ?? `brevo-api-${Date.now()}`;
    return {
      accepted: [message.to],
      messageId,
      provider: 'api',
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
      throw new Error('Configuração SMTP do Brevo incompleta');
    }

    const transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: { user: this.user, pass: this.pass },
      tls: { rejectUnauthorized: true },
    });

    try {
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
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha no envio SMTP: ${reason}`);
    }
  }
}
