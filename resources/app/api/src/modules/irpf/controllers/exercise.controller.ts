import { Request, Response } from 'express';
import { irpfService } from '../../../services/irpf.service.js';
import { badRequest, notFound } from '../../../utils/http.js';

export async function createExercise(req: Request, res: Response) {
  try {
    const { year } = req.body;
    if (!year || typeof year !== 'number') {
      return badRequest(res, 'year é obrigatório e deve ser um número');
    }

    const userId = (req as any).user?.id;
    const exercise = await irpfService.createExercise(year, userId);
    res.status(201).json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar exercício';
    return badRequest(res, message);
  }
}

export async function getExercises(_req: Request, res: Response) {
  try {
    const userId = (_req as any).user?.id;
    const exercises = await irpfService.getExercises(userId);
    res.json(exercises);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar exercícios';
    return badRequest(res, message);
  }
}

export async function getExerciseById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const exercise = await irpfService.getExerciseById(req.params.id, userId);
    if (!exercise) return notFound(res, 'Exercício não encontrado');
    res.json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar exercício';
    return badRequest(res, message);
  }
}

export async function updateExercise(req: Request, res: Response) {
  try {
    const { status, progress } = req.body;
    const userId = (req as any).user?.id;
    const exercise = await irpfService.updateExercise(req.params.id, { status, progress } as any, userId);
    if (!exercise) return notFound(res, 'Exercício não encontrado');
    res.json(exercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar exercício';
    return badRequest(res, message);
  }
}
