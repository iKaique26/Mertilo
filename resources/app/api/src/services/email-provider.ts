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

export type EmailDiagnostic = {
  configured: boolean;
  status: number | null;
  error?: string;
};

export type EmailErrorType = 
  | 'dns'
  | 'timeout'
  | 'connection'
  | 'http_401'
  | 'http_403'
  | 'http_429'
  | 'http_5xx'
  | 'auth'
  | 'config'
  | 'unknown';

export class EmailError extends Error {
  public readonly type: EmailErrorType;
  public readonly statusCode?: number;
  public readonly provider: string;
  public readonly originalError: Error | null;

  constructor(message: string, type: EmailErrorType, provider: string, originalError: Error | null = null, statusCode?: number) {
    super(message);
    this.name = 'EmailError';
    this.type = type;
    this.provider = provider;
    this.originalError = originalError;
    this.statusCode = statusCode;
  }
}

function classifyError(error: unknown, provider: string): EmailError {
  if (error instanceof EmailError) return error;
  
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  
  // DNS errors
  if (lowerMessage.includes('eai_again') || lowerMessage.includes('enotfound') || 
      lowerMessage.includes('dns') || lowerMessage.includes('getaddrinfo')) {
    return new EmailError(message, 'dns', provider, error instanceof Error ? error : null);
  }
  
  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout') || 
      lowerMessage.includes('socket hang up') || lowerMessage.includes('request timed out')) {
    return new EmailError(message, 'timeout', provider, error instanceof Error ? error : null);
  }
  
  // Connection errors
  if (lowerMessage.includes('econnrefused') || lowerMessage.includes('econnreset') || 
      lowerMessage.includes('connection refused') || lowerMessage.includes('connection reset') ||
      lowerMessage.includes('network') || lowerMessage.includes('ehostunreach')) {
    return new EmailError(message, 'connection', provider, error instanceof Error ? error : null);
  }
  
  // HTTP status codes
  const statusMatch = message.match(/\((\d{3})\)/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
  
  if (statusCode === 401 || lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
    return new EmailError(message, 'http_401', provider, error instanceof Error ? error : null, 401);
  }
  if (statusCode === 403 || lowerMessage.includes('403') || lowerMessage.includes('forbidden')) {
    return new EmailError(message, 'http_403', provider, error instanceof Error ? error : null, 403);
  }
  if (statusCode === 429 || lowerMessage.includes('429') || lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return new EmailError(message, 'http_429', provider, error instanceof Error ? error : null, 429);
  }
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return new EmailError(message, 'http_5xx', provider, error instanceof Error ? error : null, statusCode);
  }
  
  // Auth errors
  if (lowerMessage.includes('auth') || lowerMessage.includes('credential') || 
      lowerMessage.includes('invalid api key') || lowerMessage.includes('invalid token')) {
    return new EmailError(message, 'auth', provider, error instanceof Error ? error : null);
  }
  
  // Config errors
  if (lowerMessage.includes('config') || lowerMessage.includes('incomplet') || 
      lowerMessage.includes('missing') || lowerMessage.includes('not configured')) {
    return new EmailError(message, 'config', provider, error instanceof Error ? error : null);
  }
  
  return new EmailError(message, 'unknown', provider, error instanceof Error ? error : null, statusCode);
}

export function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMessage)), ms)
    )
  ]);
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

  async diagnose(): Promise<EmailDiagnostic> {
    if (!this.isConfigured()) return { configured: false, status: null };
    try {
      const response = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': this.apiKey, accept: 'application/json' } });
      return { configured: true, status: response.status, ...(response.ok ? {} : { error: `HTTP ${response.status}` }) };
    } catch (error) {
      return { configured: true, status: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) throw classifyError('Configuração Brevo incompleta', 'Brevo');
    
    const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS) || 8000;
    
    try {
      const response = await withTimeout(
        fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            sender: { email: this.fromEmail, name: this.fromName },
            to: [{ email: message.to }],
            subject: message.subject,
            textContent: message.text,
            htmlContent: message.html ?? message.text,
          }),
        }),
        timeoutMs,
        `Timeout de ${timeoutMs}ms ao conectar com Brevo API`
      );

      const raw = await response.text();
      let payload: any = null;
      try { payload = raw ? JSON.parse(raw) : null; } catch { /* preserve provider response below */ }
      
      if (!response.ok) {
        throw new Error(`Falha no envio Brevo API (${response.status}): ${payload?.message ?? (raw || response.statusText)}`);
      }
      
      return { accepted: [message.to], messageId: payload?.messageId ?? `brevo-${Date.now()}`, provider: 'brevo' };
    } catch (error) {
      throw classifyError(error, 'Brevo');
    }
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

  async diagnose(): Promise<EmailDiagnostic> {
    if (!this.isApiConfigured()) return { configured: false, status: null };
    try {
      const response = await fetch('https://send.api.mailtrap.io/api/accounts', { headers: { Authorization: `Bearer ${this.apiToken}`, accept: 'application/json' } });
      return { configured: true, status: response.status, ...(response.ok ? {} : { error: `HTTP ${response.status}` }) };
    } catch (error) {
      return { configured: true, status: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  isConfigured() {
    return this.isApiConfigured() || Boolean(this.host && this.user && this.pass && this.smtpFrom);
  }

  private async sendApi(message: EmailMessage): Promise<EmailResult> {
    const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS) || 8000;
    try {
      const response = await withTimeout(
        fetch('https://send.api.mailtrap.io/api/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: { email: this.fromEmail, name: this.fromName },
            to: [{ email: message.to }],
            subject: message.subject,
            text: message.text,
            html: message.html ?? message.text,
          }),
        }),
        timeoutMs,
        `Timeout de ${timeoutMs}ms ao conectar com Mailtrap API`
      );

      const raw = await response.text();
      let payload: any = null;
      try { payload = raw ? JSON.parse(raw) : null; } catch { /* preserve provider response below */ }
      
      if (!response.ok) {
        throw new Error(`Falha no envio Mailtrap API (${response.status}): ${payload?.errors?.join?.(', ') ?? payload?.message ?? (raw || response.statusText)}`);
      }
      
      return { accepted: [message.to], messageId: payload?.message_ids?.[0] ?? payload?.message_id ?? `api-${Date.now()}`, provider: 'api' };
    } catch (error) {
      throw classifyError(error, 'Mailtrap');
    }
  }

  private async sendSmtp(message: EmailMessage): Promise<EmailResult> {
    if (!this.host || !this.user || !this.pass || !this.smtpFrom) throw classifyError('Configuração Mailtrap incompleta', 'Mailtrap');
    
    const transporter = nodemailer.createTransport({ 
      host: this.host, 
      port: this.port, 
      secure: this.secure, 
      auth: { user: this.user, pass: this.pass }, 
      tls: { rejectUnauthorized: true },
      connectionTimeout: Number(process.env.EMAIL_TIMEOUT_MS) || 8000,
      greetingTimeout: Number(process.env.EMAIL_TIMEOUT_MS) || 8000
    });
    
    try {
      await transporter.verify();
      const info = await transporter.sendMail({ from: this.smtpFrom, to: message.to, subject: message.subject, text: message.text, html: message.html ?? message.text });
      return { accepted: [message.to], messageId: info.messageId ?? `smtp-${Date.now()}`, provider: 'smtp' };
    } catch (error) {
      throw classifyError(error, 'Mailtrap');
    }
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (this.isApiConfigured()) return this.sendApi(message);
    return this.sendSmtp(message);
  }
}
