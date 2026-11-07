/**
 * IRPF Repository
 * Acesso a dados do módulo de Imposto de Renda
 */

import { getDatabase } from '../database/db.js';
import { exercisesRepository } from '../modules/irpf/repositories/exercise.repository.js';
import { documentsRepository } from '../modules/irpf/repositories/documents.repository.js';
import { incomeRepository } from '../modules/irpf/repositories/income.repository.js';
import { assetsRepository } from '../modules/irpf/repositories/assets.repository.js';
import { deductionsRepository } from '../modules/irpf/repositories/deductions.repository.js';
import { alertsRepository } from '../modules/irpf/repositories/alerts.repository.js';
import { correctionsRepository } from '../modules/irpf/repositories/corrections.repository.js';
import { validationsRepository } from '../modules/irpf/repositories/validations.repository.js';
import { rulesRepository } from '../modules/irpf/repositories/rules.repository.js';
import { dependentsRepository } from '../modules/irpf/repositories/dependents.repository.js';
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

/**
 * EXERCISES
 */
export { exercisesRepository };

/**
 * DOCUMENTS
 */
export { documentsRepository };

/**
 * INCOME
 */
export { incomeRepository };

/**
 * ASSETS
 */
export { assetsRepository };

/**
 * DEDUCTIONS
 */
export { deductionsRepository };

/**
 * ALERTS
 */
export { alertsRepository };

/**
 * CORRECTIONS HISTORY
 */
export { correctionsRepository };

/**
 * VALIDATIONS
 */
export { validationsRepository };

/**
 * RULES
 */
export { rulesRepository };

/**
 * DEPENDENTS
 */
export { dependentsRepository };
