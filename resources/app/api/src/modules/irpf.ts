/**
 * IRPF Router
 * Rotas para o módulo de Imposto de Renda
 */

import { Router } from 'express';
import { irpfController } from '../controllers/irpf.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const irpfRouter = Router();

// Apply auth protection for all IRPF routes
irpfRouter.use(requireAuth);

// ===== EXERCISES =====
irpfRouter.post('/exercises', irpfController.createExercise);
irpfRouter.get('/exercises', irpfController.getExercises);
irpfRouter.get('/exercises/:id', irpfController.getExerciseById);
irpfRouter.put('/exercises/:id', irpfController.updateExercise);

// ===== DOCUMENTS =====
irpfRouter.post('/documents', irpfController.createDocument);
irpfRouter.get('/documents/exercise/:exercise_id', irpfController.getDocuments);
irpfRouter.get('/documents/:id', irpfController.getDocumentById);
irpfRouter.put('/documents/:id', irpfController.updateDocument);
irpfRouter.delete('/documents/:id', irpfController.deleteDocument);
irpfRouter.post('/documents/:exerciseId/upload', irpfController.uploadDocument);
irpfRouter.post('/documents/:id/confirm', irpfController.confirmDocument);

// ===== INCOME =====
irpfRouter.post('/income', irpfController.createIncome);
irpfRouter.get('/income/exercise/:exercise_id', irpfController.getIncomes);
irpfRouter.get('/income/:id', irpfController.getIncomeById);
irpfRouter.put('/income/:id', irpfController.updateIncome);
irpfRouter.delete('/income/:id', irpfController.deleteIncome);

// ===== ASSETS =====
irpfRouter.post('/assets', irpfController.createAsset);
irpfRouter.get('/assets/exercise/:exercise_id', irpfController.getAssets);
irpfRouter.get('/assets/:id', irpfController.getAssetById);
irpfRouter.put('/assets/:id', irpfController.updateAsset);
irpfRouter.delete('/assets/:id', irpfController.deleteAsset);

// ===== DEPENDENTS =====
irpfRouter.post('/dependents', irpfController.createDependent);
irpfRouter.get('/dependents/exercise/:exercise_id', irpfController.getDependents);
irpfRouter.get('/dependents/:id', irpfController.getDependentById);
irpfRouter.put('/dependents/:id', irpfController.updateDependent);
irpfRouter.delete('/dependents/:id', irpfController.deleteDependent);

// ===== DEDUCTIONS =====
irpfRouter.post('/deductions', irpfController.createDeduction);
irpfRouter.get('/deductions/exercise/:exercise_id', irpfController.getDeductions);
irpfRouter.get('/deductions/:id', irpfController.getDeductionById);
irpfRouter.put('/deductions/:id', irpfController.updateDeduction);
irpfRouter.delete('/deductions/:id', irpfController.deleteDeduction);

// ===== ALERTS =====
irpfRouter.post('/alerts', irpfController.createAlert);
irpfRouter.get('/alerts/exercise/:exercise_id', irpfController.getAlerts);
irpfRouter.get('/alerts/:id', irpfController.getAlertById);
irpfRouter.put('/alerts/:id', irpfController.updateAlert);
irpfRouter.delete('/alerts/:id', irpfController.deleteAlert);

// ===== RULES =====
irpfRouter.post('/rules', irpfController.createRule);
irpfRouter.get('/rules/:year', irpfController.getRulesByYear);

// ===== DOCUMENT PROCESSING =====
irpfRouter.post('/documents/:id/process', irpfController.processDocument);
irpfRouter.post('/documents/:id/review', irpfController.reviewDocumentExtraction);

// ===== TAX INTELLIGENCE =====
irpfRouter.post('/exercises/:exercise_id/generate-alerts', irpfController.generateExerciseAlerts);
irpfRouter.get('/exercises/:exercise_id/alerts-pending', irpfController.getPendingAlerts);
irpfRouter.put('/alerts/:alert_id/resolve', irpfController.resolveAlert);

// ===== FINANCIAL INTEGRATION =====
irpfRouter.post('/link-income-financial', irpfController.linkIncomeToFinancial);

// ===== EXERCISE SUMMARY =====
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
