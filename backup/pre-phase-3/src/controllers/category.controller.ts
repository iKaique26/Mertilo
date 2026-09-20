/**
 * Category Controller
 * Responsável por receber requisições HTTP de categorias
 */

import { Request, Response } from 'express';
import { categoryService } from '../services/category.service.js';
import { badRequest, notFound } from '../utils/http.js';

export const categoryController = {
  /**
   * GET /api/categories
   */
  async getAll(_req: Request, res: Response) {
    try {
      const categories = await categoryService.getAll();
      res.json(categories);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar categorias';
      return badRequest(res, message);
    }
  },

  /**
   * GET /api/categories/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const category = await categoryService.getById(req.params.id);
      if (!category) {
        return notFound(res, 'Categoria não encontrada');
      }
      res.json(category);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar categoria';
      return badRequest(res, message);
    }
  },

  /**
   * POST /api/categories
   */
  async create(req: Request, res: Response) {
    try {
      const { nome, cor, percentual } = req.body;
      const category = await categoryService.create(nome, cor, percentual);
      res.status(201).json(category);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar categoria';
      return badRequest(res, message);
    }
  },

  /**
   * PUT /api/categories/:id
   */
  async update(req: Request, res: Response) {
    try {
      const updated = await categoryService.update(req.params.id, req.body);
      if (!updated) {
        return notFound(res, 'Categoria não encontrada');
      }
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar categoria';
      return badRequest(res, message);
    }
  },

  /**
   * DELETE /api/categories/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const deleted = await categoryService.delete(req.params.id);
      if (!deleted) {
        return notFound(res, 'Categoria não encontrada');
      }
      res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar categoria';
      return badRequest(res, message);
    }
  },
};
