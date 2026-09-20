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
  async getAll(): Promise<MonthlyHistory[]> {
    return historyRepository.getAll();
  },

  /**
   * Retorna um histórico pelo ID
   */
  async getById(id: string): Promise<MonthlyHistory | undefined> {
    return historyRepository.getById(id);
  },

  /**
   * Cria um novo registro de histórico com validação
   */
  async create(history: Omit<MonthlyHistory, 'id' | 'criadoEm'>): Promise<MonthlyHistory> {
    // Validações de negócio
    if (!history.mes || history.mes.trim() === '') {
      throw new Error('Mês é obrigatório');
    }

    if (history.salario < 0) {
      throw new Error('Salário não pode ser negativo');
    }

    return historyRepository.create(history);
  },

  /**
   * Atualiza um registro de histórico
   */
  async update(
    id: string,
    updates: Partial<Omit<MonthlyHistory, 'id' | 'criadoEm'>>
  ): Promise<MonthlyHistory | null> {
    return historyRepository.update(id, updates);
  },

  /**
   * Deleta um registro de histórico
   */
  async delete(id: string): Promise<boolean> {
    return historyRepository.delete(id);
  },
};
