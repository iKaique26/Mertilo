/**
 * Salary Service
 * Contém a lógica de negócio para salário
 */

import { salaryRepository } from '../repositories/salary.repository.js';

export const salaryService = {
  /**
   * Retorna o salário atual
   */
  async get(): Promise<number> {
    return salaryRepository.get();
  },

  /**
   * Atualiza o salário com validação
   */
  async set(salary: number): Promise<number> {
    // Validações de negócio
    if (typeof salary !== 'number' || salary < 0) {
      throw new Error('Salário deve ser um número não-negativo');
    }

    if (!Number.isFinite(salary)) {
      throw new Error('Salário deve ser um número válido');
    }

    return salaryRepository.set(salary);
  },
};
