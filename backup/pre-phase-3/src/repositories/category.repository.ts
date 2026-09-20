/**
 * Category Repository
 * Responsável apenas pela persistência de dados de categorias
 */

import { readData, writeData } from '../data/store.js';
import type { Category } from '../types.js';

export const categoryRepository = {
  /**
   * Retorna todas as categorias
   */
  getAll(): Category[] {
    return readData().categorias;
  },

  /**
   * Retorna uma categoria pelo ID
   */
  getById(id: string): Category | undefined {
    const data = readData();
    return data.categorias.find((cat) => cat.id === id);
  },

  /**
   * Cria uma nova categoria
   */
  create(category: Omit<Category, 'id'>): Category {
    const data = readData();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    data.categorias.push(newCategory);
    writeData(data);
    return newCategory;
  },

  /**
   * Atualiza uma categoria
   */
  update(id: string, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const data = readData();
    const index = data.categorias.findIndex((cat) => cat.id === id);

    if (index === -1) {
      return null;
    }

    const current = data.categorias[index];
    data.categorias[index] = { ...current, ...updates };
    writeData(data);
    return data.categorias[index];
  },

  /**
   * Deleta uma categoria
   */
  delete(id: string): boolean {
    const data = readData();
    const initialLength = data.categorias.length;
    data.categorias = data.categorias.filter((cat) => cat.id !== id);

    if (data.categorias.length === initialLength) {
      return false;
    }

    writeData(data);
    return true;
  },
};
