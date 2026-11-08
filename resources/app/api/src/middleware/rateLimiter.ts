import { createHmac, randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const identifierKey = process.env.RATE_LIMIT_KEY_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: RATE_LIMIT_KEY_SECRET must be configured in production');
  }
  return randomBytes(32).toString('hex');
})();

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getIdentifier(req: Request): string {
  const value = req.body?.email || req.body?.username;
  return typeof value === 'string' ? value.trim().normalize('NFKC').toLowerCase() : '';
}

function hashIdentifier(value: string): string {
  return createHmac('sha256', identifierKey).update(value).digest('hex');
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const identifier = getIdentifier(req);
      return identifier
        ? `${options.keyPrefix}:ip:${getClientIp(req)}:id:${hashIdentifier(identifier)}`
        : `${options.keyPrefix}:ip:${getClientIp(req)}`;
    },
    skip: (req: Request) => {
      if (req.path === '/api/health' || req.path === '/api/health/email' || req.path === '/') {
        return true;
      }
      return false;
    },
    handler: (req: Request, res: Response) => {
      console.warn(`Rate limit exceeded: ${options.keyPrefix} from ${getClientIp(req)}`);
      res.status(429).json({ error: options.message });
    },
  });
}

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Muitas requisições, tente novamente mais tarde',
  keyPrefix: 'global',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de autenticação, tente novamente em 15 minutos',
  keyPrefix: 'auth',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos',
  keyPrefix: 'login',
});

export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Muitos cadastros, tente novamente em 1 hora',
  keyPrefix: 'register',
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Muitas solicitações de recuperação de senha, tente novamente em 1 hora',
  keyPrefix: 'password-reset',
});

export const resendVerificationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Muitos reenvios de verificação, tente novamente em 1 hora',
  keyPrefix: 'resend-verification',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Muitos uploads, tente novamente em 15 minutos',
  keyPrefix: 'upload',
});