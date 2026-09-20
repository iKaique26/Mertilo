import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = auth.split(' ')[1];
  const userId = authService.verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  // ensure session still active
  const { usersRepository } = await import('../repositories/users.repository.js');
  const session = usersRepository.findSessionByToken(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  // attach to request
  (req as any).user = { id: userId };
  next();
}
