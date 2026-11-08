/**
 * IRPF Router
 * Rotas para o módulo de Imposto de Renda
 */

import { Router } from 'express';
import { irpfController } from '../../controllers/irpf.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { uploadRateLimiter } from '../../middleware/rateLimiter.js';

const irpfRouter = Router();

// Aplique proteção por autenticação a todas as rotas do IRPF
irpfRouter.use(requireAuth);

// ===== EXERCÍCIOS =====
irpfRouter.post('/exercises', irpfController.createExercise);
irpfRouter.get('/exercises', irpfController.getExercises);
irpfRouter.get('/exercises/:id', irpfController.getExerciseById);
irpfRouter.put('/exercises/:id', irpfController.updateExercise);

// ===== DOCUMENTOS =====
irpfRouter.post('/documents', irpfController.createDocument);
irpfRouter.get('/documents/exercise/:exercise_id', irpfController.getDocuments);
irpfRouter.get('/documents/:id', irpfController.getDocumentById);
irpfRouter.put('/documents/:id', irpfController.updateDocument);
irpfRouter.delete('/documents/:id', irpfController.deleteDocument);
irpfRouter.post('/documents/:exerciseId/upload', uploadRateLimiter, irpfController.uploadDocument);
irpfRouter.post('/documents/:id/confirm', irpfController.confirmDocument);

// ===== RENDA =====
irpfRouter.post('/income', irpfController.createIncome);
irpfRouter.get('/income/exercise/:exercise_id', irpfController.getIncomes);
irpfRouter.get('/income/:id', irpfController.getIncomeById);
irpfRouter.put('/income/:id', irpfController.updateIncome);
irpfRouter.delete('/income/:id', irpfController.deleteIncome);

// ===== ATIVOS =====
irpfRouter.post('/assets', irpfController.createAsset);
irpfRouter.get('/assets/exercise/:exercise_id', irpfController.getAssets);
irpfRouter.get('/assets/:id', irpfController.getAssetById);
irpfRouter.put('/assets/:id', irpfController.updateAsset);
irpfRouter.delete('/assets/:id', irpfController.deleteAsset);

// ===== DEPENDENTES =====
irpfRouter.post('/dependents', irpfController.createDependent);
irpfRouter.get('/dependents/exercise/:exercise_id', irpfController.getDependents);
irpfRouter.get('/dependents/:id', irpfController.getDependentById);
irpfRouter.put('/dependents/:id', irpfController.updateDependent);
irpfRouter.delete('/dependents/:id', irpfController.deleteDependent);

// ===== DEDUÇÕES =====
irpfRouter.post('/deductions', irpfController.createDeduction);
irpfRouter.get('/deductions/exercise/:exercise_id', irpfController.getDeductions);
irpfRouter.get('/deductions/:id', irpfController.getDeductionById);
irpfRouter.put('/deductions/:id', irpfController.updateDeduction);
irpfRouter.delete('/deductions/:id', irpfController.deleteDeduction);

// ===== ALERTAS =====
irpfRouter.post('/alerts', irpfController.createAlert);
irpfRouter.get('/alerts/exercise/:exercise_id', irpfController.getAlerts);
irpfRouter.get('/alerts/:id', irpfController.getAlertById);
irpfRouter.put('/alerts/:id', irpfController.updateAlert);
irpfRouter.delete('/alerts/:id', irpfController.deleteAlert);

// ===== REGRAS =====
irpfRouter.post('/rules', irpfController.createRule);
irpfRouter.get('/rules/:year', irpfController.getRulesByYear);

// ===== PROCESSAMENTO DE DOCUMENTOS =====
irpfRouter.post('/documents/:id/process', irpfController.processDocument);
irpfRouter.post('/documents/:id/review', irpfController.reviewDocumentExtraction);

// ===== INTELIGÊNCIA TRIBUTÁRIA =====
irpfRouter.post('/exercises/:exercise_id/generate-alerts', irpfController.generateExerciseAlerts);
irpfRouter.get('/exercises/:exercise_id/alerts-pending', irpfController.getPendingAlerts);
irpfRouter.put('/alerts/:alert_id/resolve', irpfController.resolveAlert);

// ===== INTEGRAÇÃO FINANCEIRA =====
irpfRouter.post('/link-income-financial', irpfController.linkIncomeToFinancial);

// ===== RESUMO DO EXERCÍCIO =====
irpfRouter.get('/exercises/:exercise_id/summary', irpfController.getExerciseSummary);

// ===== CONSOLIDATION =====
irpfRouter.get('/exercises/:exercise_id/consolidation', irpfController.getConsolidation);

// ===== DUPLICATE DETECTION =====
irpfRouter.post('/exercises/:exercise_id/check-duplicate', irpfController.checkDuplicate);
irpfRouter.post('/documents/:document_id/check-duplicate', irpfController.checkDuplicate);

// ===== DASHBOARD =====
irpfRouter.get('/exercises/:exercise_id/dashboard', irpfController.getDashboardData);

// ===== INTELLIGENT ASSISTANT =====
irpfRouter.get('/exercises/:exercise_id/assistant', irpfController.getAssistantAnalysis);

// ===== CORRECTIONS =====
irpfRouter.get('/documents/:documentId/corrections', irpfController.getDocumentCorrections);
irpfRouter.get('/exercises/:exerciseId/corrections', irpfController.getExerciseCorrections);

// ===== VALIDATIONS =====
irpfRouter.get('/exercises/:exercise_id/validations', irpfController.getValidations);
irpfRouter.put('/validations/:validation_id/status', irpfController.updateValidationStatus);
irpfRouter.post('/exercises/:exercise_id/validations/rerun', irpfController.rerunValidations);

export default irpfRouter;
