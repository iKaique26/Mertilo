/**
 * Vehicle Expense Controller
 * Responsável por receber requisições HTTP de despesas de veículo
 */

import { Request, Response } from 'express';
import { vehicleExpenseService } from '../services/vehicle-expense.service.js';
import { badRequest, notFound } from '../utils/http.js';

export const vehicleExpenseController = {
  /**
   * GET /api/vexpenses/historico
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const expenses = await vehicleExpenseService.getAll(userId);
      res.json(expenses);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar despesas';
      return badRequest(res, message);
    }
  },

  /**
   * GET /api/vexpenses/historico/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const expense = await vehicleExpenseService.getById(req.params.id, userId);
      if (!expense) {
        return notFound(res, 'Despesa não encontrada');
      }
      res.json(expense);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar despesa';
      return badRequest(res, message);
    }
  },

  /**
   * POST /api/vexpenses/historico
   */
  async create(req: Request, res: Response) {
    try {
      const {
        precoCombustivel,
        mediaConsumo,
        kmPercorrido,
        tipoTrajeto,
        custo,
        receita,
        lucro,
      } = req.body;

      const userId = (req as any).user?.id;
      const expense = await vehicleExpenseService.create(
        precoCombustivel,
        mediaConsumo,
        kmPercorrido,
        tipoTrajeto,
        custo,
        receita,
        lucro,
        userId
      );
      res.status(201).json(expense);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar despesa';
      return badRequest(res, message);
    }
  },

  /**
   * PUT /api/vexpenses/historico/:id
   */
  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const updated = await vehicleExpenseService.update(req.params.id, req.body, userId);
      if (!updated) {
        return notFound(res, 'Despesa não encontrada');
      }
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar despesa';
      return badRequest(res, message);
    }
  },

  /**
   * DELETE /api/vexpenses/historico/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deleted = await vehicleExpenseService.delete(req.params.id, userId);
      if (!deleted) {
        return notFound(res, 'Despesa não encontrada');
      }
      res.json({ message: 'Despesa deletada com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar despesa';
      return badRequest(res, message);
    }
  },
};
