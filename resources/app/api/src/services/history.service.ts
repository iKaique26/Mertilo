/**
 * History Service
 * Contém a lógica de negócio para histórico
 */

import { historyRepository } from '../repositories/history.repository.js';
import type { MonthlyHistory } from '../types.js';

export const historyService = {
  /**
   * Retorna todo o histórico
   */
  async getAll(userId?: string): Promise<MonthlyHistory[]> {
    return historyRepository.getAll(userId);
  },

  /**
   * Retorna um histórico pelo ID
   */
  async getById(id: string, userId?: string): Promise<MonthlyHistory | undefined> {
    return historyRepository.getById(id, userId);
  },

  /**
   * Cria um novo registro de histórico com validação
   */
  async create(history: Omit<MonthlyHistory, 'id' | 'criadoEm'>, userId?: string): Promise<MonthlyHistory> {
    // Validações de negócio
    if (!history.mes || history.mes.trim() === '') {
      throw new Error('Mês é obrigatório');
    }

    if (history.salario < 0) {
      throw new Error('Salário não pode ser negativo');
    }

    return historyRepository.create(history, userId);
  },

  /**
   * Atualiza um registro de histórico
   */
  async update(
    id: string,
    updates: Partial<Omit<MonthlyHistory, 'id' | 'criadoEm'>>,
    userId?: string
  ): Promise<MonthlyHistory | null> {
    return historyRepository.update(id, updates, userId);
  },

  /**
   * Deleta um registro de histórico
   */
  async delete(id: string, userId?: string): Promise<boolean> {
    return historyRepository.delete(id, userId);
  },
};
