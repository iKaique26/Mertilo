/**
 * Salary Controller
 * Responsável por receber requisições HTTP de salário
 */

import { Request, Response } from 'express';
import { salaryService } from '../services/salary.service.js';
import { badRequest } from '../utils/http.js';

export const salaryController = {
  /**
   * GET /api/financas/salario
   */
  async get(_req: Request, res: Response) {
    try {
      const salary = await salaryService.get();
      res.json({ salario: salary });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar salário';
      return badRequest(res, message);
    }
  },

  /**
   * POST /api/financas/salario
   */
  async set(req: Request, res: Response) {
    try {
      const { salario } = req.body;
      if (typeof salario !== 'number') {
        return badRequest(res, 'Salário deve ser um número');
      }
      const updated = await salaryService.set(salario);
      res.json({ salario: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar salário';
      return badRequest(res, message);
    }
  },
};
