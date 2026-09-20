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
      return badRequest(res, message);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string') return badRequest(res, 'E-mail e senha são obrigatórios');
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao autenticar';
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
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body || {};
      if (typeof email !== 'string') return badRequest(res, 'E-mail é obrigatório');
      const result = await (await import('../services/auth.service.js')).authService.forgotPassword(email);
      if (result && (result as any).token) return res.json({ success: true, token: (result as any).token });
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro';
      return badRequest(res, message);
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body || {};
      if (typeof email !== 'string' || typeof token !== 'string' || typeof newPassword !== 'string') return badRequest(res, 'Dados inválidos');
      await (await import('../services/auth.service.js')).authService.resetPassword(email, token, newPassword);
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
