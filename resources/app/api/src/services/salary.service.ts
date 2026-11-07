/**
 * Salary Service
 * Contém a lógica de negócio para salário
 */

import { salaryRepository } from '../repositories/salary.repository.js';

export const salaryService = {
  /**
   * Retorna o salário atual
   */
  async get(userId?: string): Promise<number> {
    if (!userId) throw new Error('Contexto de usuário obrigatório.');
    return salaryRepository.get(userId);
  },

  /**
   * Atualiza o salário com validação
   */
  async set(salary: number, userId?: string): Promise<number> {
    if (!userId) throw new Error('Contexto de usuário obrigatório.');
    // Validações de negócio
    if (typeof salary !== 'number' || salary < 0) {
      throw new Error('Salário deve ser um número não-negativo');
    }

    if (!Number.isFinite(salary)) {
      throw new Error('Salário deve ser um número válido');
    }

    return salaryRepository.set(salary, userId);
  },
};
