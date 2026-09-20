/**
 * Vehicle Expense Service
 * Contém a lógica de negócio para despesas de veículo
 */

import { vehicleExpenseRepository } from '../repositories/vehicle-expense.repository.js';
import type { VehicleExpense } from '../types.js';

export const vehicleExpenseService = {
  /**
   * Retorna todas as despesas de veículo
   */
  async getAll(): Promise<VehicleExpense[]> {
    return vehicleExpenseRepository.getAll();
  },

  /**
   * Retorna uma despesa pelo ID
   */
  async getById(id: string): Promise<VehicleExpense | undefined> {
    return vehicleExpenseRepository.getById(id);
  },

  /**
   * Cria uma nova despesa de veículo com validação
   */
  async create(
    precoCombustivel: number,
    mediaConsumo: number,
    kmPercorrido: number,
    tipoTrajeto: 'escritorio' | 'cliente',
    custo: number,
    receita: number,
    lucro: number
  ): Promise<VehicleExpense> {
    // Validações de negócio
    if (precoCombustivel < 0) {
      throw new Error('Preço do combustível não pode ser negativo');
    }

    if (mediaConsumo <= 0) {
      throw new Error('Média de consumo deve ser positiva');
    }

    if (kmPercorrido < 0) {
      throw new Error('KM percorrido não pode ser negativo');
    }

    if (!['escritorio', 'cliente'].includes(tipoTrajeto)) {
      throw new Error('Tipo de trajeto inválido');
    }

    return vehicleExpenseRepository.create({
      precoCombustivel,
      mediaConsumo,
      kmPercorrido,
      tipoTrajeto,
      custo,
      receita,
      lucro,
    });
  },

  /**
   * Atualiza uma despesa de veículo
   */
  async update(
    id: string,
    updates: Partial<Omit<VehicleExpense, 'id' | 'data'>>
  ): Promise<VehicleExpense | null> {
    return vehicleExpenseRepository.update(id, updates);
  },

  /**
   * Deleta uma despesa de veículo
   */
  async delete(id: string): Promise<boolean> {
    return vehicleExpenseRepository.delete(id);
  },
};
