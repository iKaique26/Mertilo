/**
 * IRPF Service
 * Lógica de negócio para o módulo de Imposto de Renda
 */

import { logger } from '../utils/logger.js';
import {
  exercisesRepository,
  documentsRepository,
  incomeRepository,
  assetsRepository,
  dependentsRepository,
  deductionsRepository,
  alertsRepository,
  rulesRepository,
} from '../repositories/irpf.repository.js';
import type {
  IRPFExercise,
  IRPFDocument,
  IRPFIncome,
  IRPFAsset,
  IRPFDependent,
  IRPFDeduction,
  IRPFAlert,
  IRPFRule,
} from '../types.js';

export const irpfService = {
  // ===== EXERCISES =====

  async createExercise(year: number, userId?: string): Promise<IRPFExercise> {
    try {
      // Verificar se exercício já existe
      const existing = exercisesRepository.getByYear(year);
      if (existing) {
        throw new Error(`Exercício ${year} já existe`);
      }

      return exercisesRepository.create(year, userId);
    } catch (error) {
      logger.error('Erro ao criar exercício:', error);
      throw error;
    }
  },
  async getExercises(userId?: string): Promise<IRPFExercise[]> {
    try {
      return exercisesRepository.getAll(userId);
    } catch (error) {
      logger.error('Erro ao buscar exercícios:', error);
      throw error;
    }
  },

  async getExerciseById(id: string, userId?: string): Promise<IRPFExercise | null> {
    try {
      return exercisesRepository.getById(id, userId);
    } catch (error) {
      logger.error('Erro ao buscar exercício:', error);
      throw error;
    }
  },

  async updateExercise(id: string, data: Partial<IRPFExercise>, userId?: string): Promise<IRPFExercise | null> {
    try {
      return exercisesRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar exercício:', error);
      throw error;
    }
  },

  // ===== DOCUMENTS =====

  async createDocument(
    exerciseId: string,
    data: Omit<IRPFDocument, 'id' | 'created_at' | 'updated_at'>,
    userId?: string
  ): Promise<IRPFDocument> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) {
        throw new Error('Exercício não encontrado');
      }

      return documentsRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar documento:', error);
      throw error;
    }
  },

  async getDocuments(exerciseId: string, userId?: string): Promise<IRPFDocument[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return documentsRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar documentos:', error);
      throw error;
    }
  },

  async getDocumentById(id: string, userId?: string): Promise<IRPFDocument | null> {
    try {
      const doc = documentsRepository.getById(id, userId);
      if (!doc) return null;
      return doc;
    } catch (error) {
      logger.error('Erro ao buscar documento:', error);
      throw error;
    }
  },

  async updateDocument(id: string, data: Partial<IRPFDocument>, userId?: string): Promise<IRPFDocument | null> {
    try {
      const doc = documentsRepository.getById(id, userId);
      if (!doc) return null;
      return documentsRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar documento:', error);
      throw error;
    }
  },

  async deleteDocument(id: string, userId?: string): Promise<boolean> {
    try {
      const doc = documentsRepository.getById(id, userId);
      if (!doc) return false;
      return documentsRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar documento:', error);
      throw error;
    }
  },

  // ===== INCOME =====

  async createIncome(exerciseId: string, data: Omit<IRPFIncome, 'id' | 'created_at' | 'updated_at'>, userId?: string): Promise<IRPFIncome> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return incomeRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar rendimento:', error);
      throw error;
    }
  },

  async getIncomes(exerciseId: string, userId?: string): Promise<IRPFIncome[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return incomeRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar rendimentos:', error);
      throw error;
    }
  },

  async getIncomeById(id: string, userId?: string): Promise<IRPFIncome | null> {
    try {
      const inc = incomeRepository.getById(id, userId);
      if (!inc) return null;
      return inc;
    } catch (error) {
      logger.error('Erro ao buscar rendimento:', error);
      throw error;
    }
  },

  async updateIncome(id: string, data: Partial<IRPFIncome>, userId?: string): Promise<IRPFIncome | null> {
    try {
      const inc = incomeRepository.getById(id, userId);
      if (!inc) return null;
      return incomeRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar rendimento:', error);
      throw error;
    }
  },

  async deleteIncome(id: string, userId?: string): Promise<boolean> {
    try {
      const inc = incomeRepository.getById(id, userId);
      if (!inc) return false;
      return incomeRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar rendimento:', error);
      throw error;
    }
  },

  // ===== ASSETS =====

  async createAsset(exerciseId: string, data: Omit<IRPFAsset, 'id' | 'created_at' | 'updated_at'>, userId?: string): Promise<IRPFAsset> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return assetsRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar bem:', error);
      throw error;
    }
  },

  async getAssets(exerciseId: string, userId?: string): Promise<IRPFAsset[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return assetsRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar bens:', error);
      throw error;
    }
  },

  async getAssetById(id: string, userId?: string): Promise<IRPFAsset | null> {
    try {
      const asset = assetsRepository.getById(id, userId);
      if (!asset) return null;
      return asset;
    } catch (error) {
      logger.error('Erro ao buscar bem:', error);
      throw error;
    }
  },

  async updateAsset(id: string, data: Partial<IRPFAsset>, userId?: string): Promise<IRPFAsset | null> {
    try {
      const asset = assetsRepository.getById(id, userId);
      if (!asset) return null;
      return assetsRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar bem:', error);
      throw error;
    }
  },

  async deleteAsset(id: string, userId?: string): Promise<boolean> {
    try {
      const asset = assetsRepository.getById(id, userId);
      if (!asset) return false;
      return assetsRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar bem:', error);
      throw error;
    }
  },

  // ===== DEDUCTIONS =====

  async createDeduction(
    exerciseId: string,
    data: Omit<IRPFDeduction, 'id' | 'created_at' | 'updated_at'>
  , userId?: string): Promise<IRPFDeduction> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return deductionsRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar dedução:', error);
      throw error;
    }
  },

  async getDeductions(exerciseId: string, userId?: string): Promise<IRPFDeduction[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return deductionsRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar deduções:', error);
      throw error;
    }
  },

  async getDeductionById(id: string, userId?: string): Promise<IRPFDeduction | null> {
    try {
      const d = deductionsRepository.getById(id, userId);
      if (!d) return null;
      return d;
    } catch (error) {
      logger.error('Erro ao buscar dedução:', error);
      throw error;
    }
  },

  async updateDeduction(id: string, data: Partial<IRPFDeduction>, userId?: string): Promise<IRPFDeduction | null> {
    try {
      const d = deductionsRepository.getById(id, userId);
      if (!d) return null;
      return deductionsRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar dedução:', error);
      throw error;
    }
  },

  async deleteDeduction(id: string, userId?: string): Promise<boolean> {
    try {
      const d = deductionsRepository.getById(id, userId);
      if (!d) return false;
      return deductionsRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar dedução:', error);
      throw error;
    }
  },

  // ===== ALERTS =====

  async createAlert(exerciseId: string, data: Omit<IRPFAlert, 'id' | 'created_at' | 'updated_at'>, userId?: string): Promise<IRPFAlert> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return alertsRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar alerta:', error);
      throw error;
    }
  },

  async getAlerts(exerciseId: string, userId?: string): Promise<IRPFAlert[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return alertsRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar alertas:', error);
      throw error;
    }
  },

  async getAlertById(id: string, userId?: string): Promise<IRPFAlert | null> {
    try {
      const a = alertsRepository.getById(id, userId);
      if (!a) return null;
      return a;
    } catch (error) {
      logger.error('Erro ao buscar alerta:', error);
      throw error;
    }
  },

  async updateAlert(id: string, data: Partial<IRPFAlert>, userId?: string): Promise<IRPFAlert | null> {
    try {
      const a = alertsRepository.getById(id, userId);
      if (!a) return null;
      return alertsRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar alerta:', error);
      throw error;
    }
  },

  async deleteAlert(id: string, userId?: string): Promise<boolean> {
    try {
      const a = alertsRepository.getById(id, userId);
      if (!a) return false;
      return alertsRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar alerta:', error);
      throw error;
    }
  },

  // ===== DEPENDENTS =====

  async createDependent(
    exerciseId: string,
    data: Omit<IRPFDependent, 'id' | 'created_at' | 'updated_at'>
  , userId?: string): Promise<IRPFDependent> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return dependentsRepository.create(exerciseId, data);
    } catch (error) {
      logger.error('Erro ao criar dependente:', error);
      throw error;
    }
  },

  async getDependents(exerciseId: string, userId?: string): Promise<IRPFDependent[]> {
    try {
      const exercise = exercisesRepository.getById(exerciseId, userId);
      if (!exercise) throw new Error('Exercício não encontrado');
      return dependentsRepository.getAll(exerciseId, userId);
    } catch (error) {
      logger.error('Erro ao buscar dependentes:', error);
      throw error;
    }
  },

  async getDependentById(id: string, userId?: string): Promise<IRPFDependent | null> {
    try {
      const d = dependentsRepository.getById(id, userId);
      if (!d) return null;
      return d;
    } catch (error) {
      logger.error('Erro ao buscar dependente:', error);
      throw error;
    }
  },

  async updateDependent(id: string, data: Partial<IRPFDependent>, userId?: string): Promise<IRPFDependent | null> {
    try {
      const d = dependentsRepository.getById(id, userId);
      if (!d) return null;
      return dependentsRepository.update(id, data, userId);
    } catch (error) {
      logger.error('Erro ao atualizar dependente:', error);
      throw error;
    }
  },

  async deleteDependent(id: string, userId?: string): Promise<boolean> {
    try {
      const d = dependentsRepository.getById(id, userId);
      if (!d) return false;
      return dependentsRepository.delete(id, userId);
    } catch (error) {
      logger.error('Erro ao deletar dependente:', error);
      throw error;
    }
  },

  // ===== RULES =====

  async createRule(data: Omit<IRPFRule, 'id' | 'created_at' | 'updated_at'>): Promise<IRPFRule> {
    try {
      return rulesRepository.create(data);
    } catch (error) {
      logger.error('Erro ao criar regra:', error);
      throw error;
    }
  },

  async getRulesByYear(year: number): Promise<IRPFRule[]> {
    try {
      return rulesRepository.getByYear(year);
    } catch (error) {
      logger.error('Erro ao buscar regras:', error);
      throw error;
    }
  },

  async getRulesByYearAndType(year: number, ruleType: string): Promise<IRPFRule[]> {
    try {
      return rulesRepository.getByYearAndType(year, ruleType);
    } catch (error) {
      logger.error('Erro ao buscar regras por tipo:', error);
      throw error;
    }
  },

  async deleteRule(id: string): Promise<boolean> {
    try {
      return rulesRepository.delete(id);
    } catch (error) {
      logger.error('Erro ao deletar regra:', error);
      throw error;
    }
  },
};
