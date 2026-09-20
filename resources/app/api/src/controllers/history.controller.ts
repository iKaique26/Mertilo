/**
 * History Controller
 * Responsável por receber requisições HTTP de histórico
 */

import { Request, Response } from 'express';
import { historyService } from '../services/history.service.js';
import { badRequest, notFound } from '../utils/http.js';

export const historyController = {
  /**
   * GET /api/financas/historico
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const history = await historyService.getAll(userId);
      res.json(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar histórico';
      return badRequest(res, message);
    }
  },

  /**
   * GET /api/financas/historico/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const history = await historyService.getById(req.params.id, userId);
      if (!history) {
        return notFound(res, 'Histórico não encontrado');
      }
      res.json(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar histórico';
      return badRequest(res, message);
    }
  },

  /**
   * POST /api/financas/historico
   */
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const history = await historyService.create(req.body, userId);
      res.status(201).json(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar histórico';
      return badRequest(res, message);
    }
  },

  /**
   * PUT /api/financas/historico/:id
   */
  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const updated = await historyService.update(req.params.id, req.body, userId);
      if (!updated) {
        return notFound(res, 'Histórico não encontrado');
      }
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar histórico';
      return badRequest(res, message);
    }
  },

  /**
   * DELETE /api/financas/historico/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deleted = await historyService.delete(req.params.id, userId);
      if (!deleted) {
        return notFound(res, 'Histórico não encontrado');
      }
      res.json({ message: 'Histórico deletado com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar histórico';
      return badRequest(res, message);
    }
  },
};
