/**
 * Category Service
 * Contém a lógica de negócio para categorias
 */

import { categoryRepository } from '../repositories/category.repository.js';
import type { Category } from '../types.js';

export const categoryService = {
  /**
   * Retorna todas as categorias
   */
  async getAll(): Promise<Category[]> {
    return categoryRepository.getAll();
  },

  /**
   * Retorna uma categoria pelo ID
   */
  async getById(id: string): Promise<Category | undefined> {
    return categoryRepository.getById(id);
  },

  /**
   * Cria uma nova categoria com validação
   */
  async create(
    nome: string,
    cor: string,
    percentual: number
  ): Promise<Category> {
    // Validações de negócio
    if (!nome || nome.trim() === '') {
      throw new Error('Nome da categoria é obrigatório');
    }

    if (!cor || cor.trim() === '') {
      throw new Error('Cor é obrigatória');
    }

    if (typeof percentual !== 'number' || percentual < 0 || percentual > 1) {
      throw new Error('Percentual deve estar entre 0 e 1');
    }

    return categoryRepository.create({
      nome: nome.trim(),
      cor: cor.trim(),
      percentual,
    });
  },

  /**
   * Atualiza uma categoria existente
   */
  async update(
    id: string,
    updates: Partial<Omit<Category, 'id'>>
  ): Promise<Category | null> {
    // Validações de negócio
    if (updates.nome !== undefined && (!updates.nome || updates.nome.trim() === '')) {
      throw new Error('Nome inválido');
    }

    if (updates.percentual !== undefined) {
      if (typeof updates.percentual !== 'number' || updates.percentual < 0 || updates.percentual > 1) {
        throw new Error('Percentual deve estar entre 0 e 1');
      }
    }

    return categoryRepository.update(id, updates);
  },

  /**
   * Deleta uma categoria
   */
  async delete(id: string): Promise<boolean> {
    return categoryRepository.delete(id);
  },
};
