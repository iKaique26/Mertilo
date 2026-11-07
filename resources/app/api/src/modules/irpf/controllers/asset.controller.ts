import { Request, Response } from 'express';
import { irpfService } from '../../../services/irpf.service.js';
import { badRequest, notFound } from '../../../utils/http.js';

export async function createAsset(req: Request, res: Response) {
  try {
    const { exercise_id, document_id, asset_type, description, value, location, confidence_score, is_verified } = req.body;
    if (!exercise_id || !asset_type || typeof value !== 'number') {
      return badRequest(res, 'Campos obrigatórios: exercise_id, asset_type, value');
    }
    const userId = (req as any).user?.id;
    const asset = await irpfService.createAsset(exercise_id, { exercise_id, document_id, asset_type, description, value, location, confidence_score: confidence_score || 100, is_verified: is_verified || false }, userId);
    res.status(201).json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar bem';
    return badRequest(res, message);
  }
}

export async function getAssets(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const assets = await irpfService.getAssets(req.params.exercise_id, userId);
    res.json(assets);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar bens';
    return badRequest(res, message);
  }
}

export async function getAssetById(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const asset = await irpfService.getAssetById(req.params.id, userId);
    if (!asset) return notFound(res, 'Bem não encontrado');
    res.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar bem';
    return badRequest(res, message);
  }
}

export async function updateAsset(req: Request, res: Response) {
  try {
    const { value, description, confidence_score, is_verified } = req.body;
    const userId = (req as any).user?.id;
    const asset = await irpfService.updateAsset(req.params.id, { value, description, confidence_score, is_verified } as any, userId);
    if (!asset) return notFound(res, 'Bem não encontrado');
    res.json(asset);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar bem';
    return badRequest(res, message);
  }
}

export async function deleteAsset(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    await irpfService.deleteAsset(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar bem';
    return badRequest(res, message);
  }
}
