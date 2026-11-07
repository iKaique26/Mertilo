import { Request, Response } from 'express';
import { irpfService } from '../../../services/irpf.service.js';
import { badRequest, notFound } from '../../../utils/http.js';

export async function createIncome(req: Request, res: Response) {
  try {
    const { exercise_id, document_id, income_type, description, amount, month, source, confidence_score, is_verified } = req.body;
    if (!exercise_id || !income_type || typeof amount !== 'number') {
      return badRequest(res, 'Campos obrigatórios: exercise_id, income_type, amount');
    }
    const userId = (req as any).user?.id;
    const income = await irpfService.createIncome(exercise_id, { exercise_id, document_id, income_type, description, amount, month, source, confidence_score: confidence_score || 100, is_verified: is_verified || false }, userId);
    res.status(201).json(income);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar rendimento';
    return badRequest(res, message);
  }
}

export async function getIncomes(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const incomes = await irpfService.getIncomes(req.params.exercise_id, userId);
    res.json(incomes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar rendimentos';
    return badRequest(res, message);
  }
}

export async function getIncomeById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const income = await irpfService.getIncomeById(req.params.id, userId);
    if (!income) return notFound(res, 'Rendimento não encontrado');
    res.json(income);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar rendimento';
    return badRequest(res, message);
  }
}

export async function updateIncome(req: Request, res: Response) {
  try {
    const { amount, description, confidence_score, is_verified } = req.body;
    const userId = (req as any).user?.id;
    const income = await irpfService.updateIncome(req.params.id, { amount, description, confidence_score, is_verified } as any, userId);
    if (!income) return notFound(res, 'Rendimento não encontrado');
    res.json(income);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar rendimento';
    return badRequest(res, message);
  }
}

export async function deleteIncome(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    await irpfService.deleteIncome(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar rendimento';
    return badRequest(res, message);
  }
}
