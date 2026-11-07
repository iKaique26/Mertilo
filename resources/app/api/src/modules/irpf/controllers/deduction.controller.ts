import { Request, Response } from 'express';
import { irpfService } from '../../../services/irpf.service.js';
import { badRequest, notFound } from '../../../utils/http.js';

export async function createDeduction(req: Request, res: Response) {
  try {
    const { exercise_id, document_id, deduction_type, description, amount, category, confidence_score, is_verified } = req.body;
    if (!exercise_id || !deduction_type || typeof amount !== 'number') {
      return badRequest(res, 'Campos obrigatórios: exercise_id, deduction_type, amount');
    }
    const userId = (req as any).user?.id;
    const deduction = await irpfService.createDeduction(exercise_id, { exercise_id, document_id, deduction_type, description, amount, category, confidence_score: confidence_score || 100, is_verified: is_verified || false }, userId);
    res.status(201).json(deduction);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar dedução';
    return badRequest(res, message);
  }
}

export async function getDeductions(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const deductions = await irpfService.getDeductions(req.params.exercise_id, userId);
    res.json(deductions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar deduções';
    return badRequest(res, message);
  }
}

export async function getDeductionById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const deduction = await irpfService.getDeductionById(req.params.id, userId);
    if (!deduction) return notFound(res, 'Dedução não encontrada');
    res.json(deduction);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar dedução';
    return badRequest(res, message);
  }
}

export async function updateDeduction(req: Request, res: Response) {
  try {
    const { amount, description, confidence_score, is_verified } = req.body;
    const userId = (req as any).user?.id;
    const deduction = await irpfService.updateDeduction(req.params.id, { amount, description, confidence_score, is_verified } as any, userId);
    if (!deduction) return notFound(res, 'Dedução não encontrada');
    res.json(deduction);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar dedução';
    return badRequest(res, message);
  }
}

export async function deleteDeduction(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    await irpfService.deleteDeduction(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar dedução';
    return badRequest(res, message);
  }
}
