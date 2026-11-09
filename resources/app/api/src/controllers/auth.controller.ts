import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { badRequest } from '../utils/http.js';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body || {};
      if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return badRequest(res, 'Dados inválidos para registro');
      }
      const result = await authService.register(name, email, password);
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar usuário';
      const normalized = message.toLowerCase();
      const clientMessage = normalized.includes('key not found') || normalized.includes('falha no envio') || normalized.includes('api')
        ? 'Não foi possível concluir o cadastro. Verifique o e-mail e tente novamente.'
        : message;
      return badRequest(res, clientMessage);
    }
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body || {};
    try {
      if (typeof email !== 'string' || typeof password !== 'string') return badRequest(res, 'E-mail e senha são obrigatórios');
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao autenticar';
      console.log(`[LOGIN] Falha para ${email}: ${message}`);
      
      if (message === 'Usuário ou senha inválidos') {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      if (message === 'Conta não verificada') {
        return res.status(403).json({ error: 'E-mail não verificado. Verifique sua caixa de entrada.' });
      }
      
      return badRequest(res, message);
    }
  },
  async verifyEmail(req: Request, res: Response) {
    try {
      const { email, code } = req.body || {};
      if (typeof email !== 'string' || typeof code !== 'string') return badRequest(res, 'E-mail e código são obrigatórios');
      const result = await (await import('../services/auth.service.js')).authService.verifyEmail(email, code);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body || {};
      if (typeof email !== 'string') return badRequest(res, 'E-mail é obrigatório');
      await (await import('../services/auth.service.js')).authService.resendVerification(email);
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao reenviar verificação:", err);
      const message = err instanceof Error ? err.message : 'Erro';
      
      // Se o erro for do provedor de e-mail ou algo inesperado, retornar 500
      if (message.includes('provedor') || message.includes('Falha no envio')) {
        return res.status(500).json({ error: message });
      }
      
      return badRequest(res, message);
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body || {};
      if (typeof email !== 'string') return badRequest(res, 'E-mail é obrigatório');
      await (await import('../services/auth.service.js')).authService.forgotPassword(email);
      res.json({ success: true });
    } catch (err) {
      console.error('[AUTH] password reset email failed', err instanceof Error ? err.message : err);
      return res.json({ success: true });
    }
  },

  async validateResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body || {};
      if (typeof token !== 'string') return badRequest(res, 'Token é obrigatório');
      const result = await (await import('../services/auth.service.js')).authService.validateResetToken(token);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body || {};
      if (typeof token !== 'string' || typeof newPassword !== 'string') return badRequest(res, 'Dados inválidos');
      await (await import('../services/auth.service.js')).authService.resetPassword(token, newPassword);
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { currentPassword, newPassword } = req.body || {};
      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') return badRequest(res, 'Dados inválidos');
      await (await import('../services/auth.service.js')).authService.changePassword(user.id, currentPassword, newPassword);
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) return res.status(204).end();
      const token = auth.split(' ')[1];
      await (await import('../services/auth.service.js')).authService.logout(token);
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },
  async me(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      // fetch fresh user
      const { usersRepository } = await import('../repositories/users.repository.js');
      const u = usersRepository.findById(user.id);
      if (!u) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.json({ id: u.id, name: u.name, email: u.email, is_verified: u.is_verified });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  }
};
