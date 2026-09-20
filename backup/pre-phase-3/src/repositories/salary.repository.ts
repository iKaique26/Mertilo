/**
 * Salary Repository
 * Responsável apenas pela persistência de dados de salário
 */

import { readData, writeData } from '../data/store.js';

export const salaryRepository = {
  /**
   * Retorna o salário atual
   */
  get(): number {
    return readData().salario;
  },

  /**
   * Atualiza o salário
   */
  set(salary: number): number {
    const data = readData();
    data.salario = salary;
    writeData(data);
    return data.salario;
  },
};
