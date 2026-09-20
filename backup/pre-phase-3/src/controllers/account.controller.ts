/**
 * Account Controller
 * Responsável por receber requisições HTTP, validar e chamar o service
 */

import { Request, Response } from 'express';
import { accountService } from '../services/account.service.js';
import { badRequest, notFound } from '../utils/http.js';

export const accountController = {
  /**
   * GET /api/financas/contas
   */
  async getAll(_req: Request, res: Response) {
    try {
      const accounts = await accountService.getAll();
      res.json(accounts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar contas';
      return badRequest(res, message);
    }
  },

  /**
   * GET /api/financas/contas/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const account = await accountService.getById(req.params.id);
      if (!account) {
        return notFound(res, 'Conta não encontrada');
      }
      res.json(account);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar conta';
      return badRequest(res, message);
    }
  },

  /**
   * POST /api/financas/contas
   */
  async create(req: Request, res: Response) {
    try {
      const { nome, valor, categoria, isFixed } = req.body;
      const account = await accountService.create(nome, valor, categoria, isFixed);
      res.status(201).json(account);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      return badRequest(res, message);
    }
  },

  /**
   * PUT /api/financas/contas/:id
   */
  async update(req: Request, res: Response) {
    try {
      const updated = await accountService.update(req.params.id, req.body);
      if (!updated) {
        return notFound(res, 'Conta não encontrada');
      }
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar conta';
      return badRequest(res, message);
    }
  },

  /**
   * DELETE /api/financas/contas/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const deleted = await accountService.delete(req.params.id);
      if (!deleted) {
        return notFound(res, 'Conta não encontrada');
      }
      res.json({ message: 'Conta deletada com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar conta';
      return badRequest(res, message);
    }
  },
};
