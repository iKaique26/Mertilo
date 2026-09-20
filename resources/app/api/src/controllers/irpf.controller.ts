/**
 * IRPF Controller
 * Recebe requisições HTTP e delega para os services
 */

import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { irpfService } from '../services/irpf.service.js';
import { badRequest, notFound } from '../utils/http.js';
import { taxIntelligenceService } from '../services/tax-intelligence.js';
import { financialIntegrationService } from '../services/financial-integration.js';
import { documentReaderManager } from '../services/document-reader.js';
import { processFile } from '../services/file-processor.js';
import { logger } from '../utils/logger.js';
import { AssistantService } from '../services/irpf-assistant.js';
import { IRPFValidationService } from '../services/irpf-validation.js';
import { correctionsRepository } from '../repositories/irpf.repository.js';
import { validationsRepository } from '../repositories/irpf.repository.js';

export const irpfController = {
  // ===== EXERCISES =====

  async createExercise(req: Request, res: Response) {
    try {
      const { year } = req.body;
      if (!year || typeof year !== 'number') {
        return badRequest(res, 'year é obrigatório e deve ser um número');
      }

      const userId = (req as any).user?.id;
      const exercise = await irpfService.createExercise(year, userId);
      res.status(201).json(exercise);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar exercício';
      return badRequest(res, message);
    }
  },

  async getExercises(_req: Request, res: Response) {
    try {
      const userId = (_req as any).user?.id;
      const exercises = await irpfService.getExercises(userId);
      res.json(exercises);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar exercícios';
      return badRequest(res, message);
    }
  },

  async getExerciseById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const exercise = await irpfService.getExerciseById(req.params.id, userId);
      if (!exercise) {
        return notFound(res, 'Exercício não encontrado');
      }
      res.json(exercise);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar exercício';
      return badRequest(res, message);
    }
  },

  async updateExercise(req: Request, res: Response) {
    try {
      const { status, progress } = req.body;
      const userId = (req as any).user?.id;
      const exercise = await irpfService.updateExercise(req.params.id, { status, progress } as any, userId);
      if (!exercise) {
        return notFound(res, 'Exercício não encontrado');
      }
      res.json(exercise);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar exercício';
      return badRequest(res, message);
    }
  },

  // ===== DOCUMENTS =====

  async createDocument(req: Request, res: Response) {
    try {
      const { exercise_id, filename, file_path, file_type, mime_type, file_size, document_type } = req.body;

      if (!exercise_id || !filename || !file_path || !file_type || !mime_type || !file_size) {
        return badRequest(res, 'Campos obrigatórios: exercise_id, filename, file_path, file_type, mime_type, file_size');
      }

      const userId = (req as any).user?.id;
      const document = await irpfService.createDocument(exercise_id, {
        exercise_id,
        filename,
        file_path,
        file_type,
        mime_type,
        file_size,
        document_type,
        status: 'pending',
        extraction_progress: 0,
        confidence_score: 0,
        is_verified: false,
      }, userId);

      res.status(201).json(document);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar documento';
      return badRequest(res, message);
    }
  },

  async getDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const documents = await irpfService.getDocuments(req.params.exercise_id, userId);
      res.json(documents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar documentos';
      return badRequest(res, message);
    }
  },

  async getDocumentById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const document = await irpfService.getDocumentById(req.params.id, userId);
      if (!document) {
        return notFound(res, 'Documento não encontrado');
      }
      res.json(document);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar documento';
      return badRequest(res, message);
    }
  },

  async updateDocument(req: Request, res: Response) {
    try {
      const { status, extraction_progress, extracted_data, confidence_score, is_verified } = req.body;
      const userId = (req as any).user?.id;
      const document = await irpfService.updateDocument(req.params.id, {
        status,
        extraction_progress,
        extracted_data,
        confidence_score,
        is_verified,
      } as any, userId);

      if (!document) {
        return notFound(res, 'Documento não encontrado');
      }
      res.json(document);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar documento';
      return badRequest(res, message);
    }
  },

  async deleteDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteDocument(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar documento';
      return badRequest(res, message);
    }
  },

  async uploadDocument(req: Request, res: Response) {
    const { exerciseId } = req.params;
    const { filename, mime_type, file_size, file_content } = req.body;

    try {
      // Validar entrada
      if (!exerciseId || !filename || !mime_type || !file_content) {
        return badRequest(res, 'Faltam campos obrigatórios');
      }

      // Validar MIME type
      const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!ALLOWED_MIMES.includes(mime_type)) {
        return badRequest(res, `MIME type não permitido: ${mime_type}`);
      }

      // Validar extensão
      const ext = path.extname(filename).toLowerCase();
      const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.xls', '.xlsx'];
      if (!ALLOWED_EXTS.includes(ext)) {
        return badRequest(res, `Extensão não permitida: ${ext}`);
      }

      // Validar tamanho
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file_size > MAX_SIZE) {
        return badRequest(res, `Arquivo muito grande: ${(file_size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Verificar path traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return badRequest(res, 'Nome de arquivo inválido');
      }

      // Criar diretório privado de documentos
      const docDir = path.join(process.cwd(), 'api', 'data', 'documents', exerciseId);
      if (!fs.existsSync(docDir)) {
        fs.mkdirSync(docDir, { recursive: true });
      }

      // Gerar nome único
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${filename}`;
      const filePath = path.join(docDir, uniqueFilename);

      // Decodificar e salvar arquivo
      const buffer = Buffer.from(file_content.split(',')[1] || file_content, 'base64');
      fs.writeFileSync(filePath, buffer);

      logger.info(`Arquivo salvo: ${filePath}`);

      // Processar arquivo
      const processResult = await processFile(filePath, mime_type);

      // Criar registro no banco (sem extracted_data inicialmente)
      const userId = (req as any).user?.id;
      const document = await irpfService.createDocument(exerciseId, {
        exercise_id: exerciseId,
        filename: filename,
        file_path: filePath,
        file_type: ext.substring(1),
        mime_type: mime_type,
        file_size: file_size,
        document_type: processResult.documentType,
        status: 'pending',
        extraction_progress: 0,
        confidence_score: 0,
        is_verified: false,
      }, userId);

      // Atualizar com dados extraídos
      const updated = await irpfService.updateDocument(document.id, {
        extracted_data: JSON.stringify(processResult),
        status: 'extracted',
        extraction_progress: 100,
        confidence_score: processResult.confidence || 0,
      }, userId);

      // Gerar alertas se necessário
      if (processResult.errors && processResult.errors.length > 0) {
        for (const error of processResult.errors) {
          await taxIntelligenceService.createAlert(exerciseId, 'extraction_error', 'warning', error, updated?.id);
        }
      }

      if ((processResult.confidence || 0) < 70) {
        await taxIntelligenceService.createAlert(
          exerciseId,
          'low_confidence',
          'info',
          `Confiança: ${processResult.confidence}%`,
          updated?.id
        );
      }

      res.status(201).json({
        document: updated || document,
        extraction: processResult,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload';
      logger.error(`Upload error: ${message}`, error);
      return badRequest(res, message);
    }
  },

  async confirmDocument(req: Request, res: Response) {
    const { id } = req.params;
    const { extracted_data, corrections } = req.body;

    try {
      // Buscar documento
      const userId = (req as any).user?.id;
      const document = await irpfService.getDocumentById(id, userId);
      if (!document) {
        return notFound(res, 'Documento não encontrado');
      }

      // Aplicar correções se fornecidas
      let finalData = extracted_data || document.extracted_data;
      if (corrections) {
        const parsedData = typeof finalData === 'string' ? JSON.parse(finalData) : finalData;

        // Ensure corrections history container
        parsedData._corrections = parsedData._corrections || [];

        // Aplicar correções em holeriteData se existir
        if (parsedData.holeriteData && typeof corrections === 'object') {
            for (const [key, value] of Object.entries(corrections)) {
              const original = parsedData.holeriteData[key];
              // push history entry (store actor id/email, not full user object)
              const actor = (req as any).user ? ((req as any).user.id || (req as any).user.email || 'manual') : 'manual';
              parsedData._corrections.push({ field: key, original, corrected: value, at: new Date().toISOString(), by: actor });
              parsedData.holeriteData[key] = value;
            }
        }

        finalData = JSON.stringify(parsedData);
      }

      // Atualizar documento como verificado
      const updated = await irpfService.updateDocument(id, {
        extracted_data: finalData,
        is_verified: true,
        status: 'extracted',
      });

      // Persistir histórico de correções no banco
      try {
        const parsedFinal = typeof finalData === 'string' ? JSON.parse(finalData) : finalData;
        if (parsedFinal && Array.isArray(parsedFinal._corrections)) {
          for (const c of parsedFinal._corrections) {
            try {
              correctionsRepository.create(document.exercise_id, {
                document_id: document.id,
                field_name: c.field,
                original_value: c.original,
                corrected_value: c.corrected,
                actor: c.by || 'manual',
                reason: c.reason || null,
              });
            } catch (err) {
              logger.error('Erro ao persistir correção', err);
            }
          }
        }
      } catch (err) {
        logger.error('Erro ao processar histórico de correções', err);
      }

      // Importar dados para rendimentos conforme tipo
      const data = typeof finalData === 'string' ? JSON.parse(finalData) : finalData;
      
      if (data.documentType === 'holerite' && document.exercise_id) {
        const holeriteData = data.holeriteData;
        
        if (holeriteData) {
          // Extrair mês da competência (MM/YYYY)
          const competenciaMatch = (holeriteData.competencia || '').match(/(\d{1,2})/);
          const month = competenciaMatch ? parseInt(competenciaMatch[1]) : undefined;
          
          // Criar rendimento com dados do holerite
          await irpfService.createIncome(document.exercise_id, {
            exercise_id: document.exercise_id,
            document_id: id,
            income_type: 'tributavel',
            description: `Salário - ${holeriteData.competencia || 'N/A'} (${holeriteData.empresa || 'Desconhecido'})`,
            amount: holeriteData.salario_bruto || 0,
            month,
            source: holeriteData.empresa || holeriteData.cnpj || 'Desconhecido',
            confidence_score: data.confidence || 100,
            is_verified: true,
          }, userId);

          // Log success
          logger.info(`Rendimento criado para documento ${id}: ${holeriteData.salario_bruto} (${holeriteData.competencia})`);
        }
      } else if (data.documentType === 'medical_receipt' || data.documentType === 'dental_receipt') {
        // Handle medical/dental deductions
        const fields = data.fields || [];
        const fieldMap = Object.fromEntries(fields.map((f: any) => [f.name, f.value]));
        const valueMatch = (fieldMap.Valor || '').match(/([\d\.,]+)/);
        const amount = valueMatch ? parseFloat(valueMatch[1].replace('.', '').replace(',', '.')) : 0;

        if (amount > 0) {
          await irpfService.createDeduction(document.exercise_id, {
            exercise_id: document.exercise_id,
            document_id: id,
            deduction_type: data.documentType === 'medical_receipt' ? 'medical' : 'dental',
            description: fieldMap.Procedimento || fieldMap.Paciente || 'Procedimento',
            amount,
            confidence_score: data.confidence || 100,
            is_verified: true,
          }, userId);
        }
      }

      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao confirmar documento';
      logger.error(`Confirm error: ${message}`, error);
      return badRequest(res, message);
    }
  },

  // ===== INCOME =====

  async createIncome(req: Request, res: Response) {
    try {
      const { exercise_id, document_id, income_type, description, amount, month, source, confidence_score, is_verified } = req.body;

      if (!exercise_id || !income_type || typeof amount !== 'number') {
        return badRequest(res, 'Campos obrigatórios: exercise_id, income_type, amount');
      }

      const userId = (req as any).user?.id;
      const income = await irpfService.createIncome(exercise_id, {
        exercise_id,
        document_id,
        income_type,
        description,
        amount,
        month,
        source,
        confidence_score: confidence_score || 100,
        is_verified: is_verified || false,
      }, userId);

      res.status(201).json(income);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar rendimento';
      return badRequest(res, message);
    }
  },

  async getIncomes(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const incomes = await irpfService.getIncomes(req.params.exercise_id, userId);
      res.json(incomes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar rendimentos';
      return badRequest(res, message);
    }
  },

  async getIncomeById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const income = await irpfService.getIncomeById(req.params.id, userId);
      if (!income) {
        return notFound(res, 'Rendimento não encontrado');
      }
      res.json(income);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar rendimento';
      return badRequest(res, message);
    }
  },

  async updateIncome(req: Request, res: Response) {
    try {
      const { amount, description, confidence_score, is_verified } = req.body;
      const userId = (req as any).user?.id;
      const income = await irpfService.updateIncome(req.params.id, {
        amount,
        description,
        confidence_score,
        is_verified,
      } as any, userId);

      if (!income) {
        return notFound(res, 'Rendimento não encontrado');
      }
      res.json(income);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar rendimento';
      return badRequest(res, message);
    }
  },

  async deleteIncome(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteIncome(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar rendimento';
      return badRequest(res, message);
    }
  },

  // ===== ASSETS =====

  async createAsset(req: Request, res: Response) {
    try {
      const { exercise_id, document_id, asset_type, description, value, location, confidence_score, is_verified } = req.body;
      if (!exercise_id || !asset_type || typeof value !== 'number') {
        return badRequest(res, 'Campos obrigatórios: exercise_id, asset_type, value');
      }

      const userId = (req as any).user?.id;
      const asset = await irpfService.createAsset(exercise_id, {
        exercise_id,
        document_id,
        asset_type,
        description,
        value,
        location,
        confidence_score: confidence_score || 100,
        is_verified: is_verified || false,
      }, userId);

      res.status(201).json(asset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar bem';
      return badRequest(res, message);
    }
  },

  async getAssets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const assets = await irpfService.getAssets(req.params.exercise_id, userId);
      res.json(assets);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar bens';
      return badRequest(res, message);
    }
  },

  async getAssetById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const asset = await irpfService.getAssetById(req.params.id, userId);
      if (!asset) {
        return notFound(res, 'Bem não encontrado');
      }
      res.json(asset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar bem';
      return badRequest(res, message);
    }
  },

  async updateAsset(req: Request, res: Response) {
    try {
      const { value, description, confidence_score, is_verified } = req.body;
      const userId = (req as any).user?.id;
      const asset = await irpfService.updateAsset(req.params.id, {
        value,
        description,
        confidence_score,
        is_verified,
      } as any, userId);

      if (!asset) {
        return notFound(res, 'Bem não encontrado');
      }
      res.json(asset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar bem';
      return badRequest(res, message);
    }
  },

  async deleteAsset(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteAsset(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar bem';
      return badRequest(res, message);
    }
  },

  // ===== DEPENDENTS =====

  async createDependent(req: Request, res: Response) {
    try {
      const { exercise_id, name, cpf, birth_date, relationship } = req.body;

      if (!exercise_id || !name || !relationship) {
        return badRequest(res, 'Campos obrigatórios: exercise_id, name, relationship');
      }

      const userId = (req as any).user?.id;
      const dependent = await irpfService.createDependent(exercise_id, {
        exercise_id,
        name,
        cpf,
        birth_date,
        relationship,
        is_verified: false,
      }, userId);

      res.status(201).json(dependent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar dependente';
      return badRequest(res, message);
    }
  },

  async getDependents(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const dependents = await irpfService.getDependents(req.params.exercise_id, userId);
      res.json(dependents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dependentes';
      return badRequest(res, message);
    }
  },

  async getDependentById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const dependent = await irpfService.getDependentById(req.params.id, userId);
      if (!dependent) {
        return notFound(res, 'Dependente não encontrado');
      }
      res.json(dependent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dependente';
      return badRequest(res, message);
    }
  },

  async updateDependent(req: Request, res: Response) {
    try {
      const { name, cpf, birth_date, relationship, is_verified } = req.body;
      const userId = (req as any).user?.id;
      const dependent = await irpfService.updateDependent(req.params.id, {
        name,
        cpf,
        birth_date,
        relationship,
        is_verified,
      } as any, userId);

      if (!dependent) {
        return notFound(res, 'Dependente não encontrado');
      }
      res.json(dependent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar dependente';
      return badRequest(res, message);
    }
  },

  async deleteDependent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteDependent(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar dependente';
      return badRequest(res, message);
    }
  },

  // ===== DEDUCTIONS =====

  async createDeduction(req: Request, res: Response) {
    try {
      const { exercise_id, document_id, deduction_type, description, amount, category, confidence_score, is_verified } = req.body;

      if (!exercise_id || !deduction_type || typeof amount !== 'number') {
        return badRequest(res, 'Campos obrigatórios: exercise_id, deduction_type, amount');
      }

      const userId = (req as any).user?.id;
      const deduction = await irpfService.createDeduction(exercise_id, {
        exercise_id,
        document_id,
        deduction_type,
        description,
        amount,
        category,
        confidence_score: confidence_score || 100,
        is_verified: is_verified || false,
      }, userId);

      res.status(201).json(deduction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar dedução';
      return badRequest(res, message);
    }
  },

  async getDeductions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deductions = await irpfService.getDeductions(req.params.exercise_id, userId);
      res.json(deductions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar deduções';
      return badRequest(res, message);
    }
  },

  async getDeductionById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deduction = await irpfService.getDeductionById(req.params.id, userId);
      if (!deduction) {
        return notFound(res, 'Dedução não encontrada');
      }
      res.json(deduction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dedução';
      return badRequest(res, message);
    }
  },

  async updateDeduction(req: Request, res: Response) {
    try {
      const { amount, description, confidence_score, is_verified } = req.body;
      const userId = (req as any).user?.id;
      const deduction = await irpfService.updateDeduction(req.params.id, {
        amount,
        description,
        confidence_score,
        is_verified,
      } as any, userId);

      if (!deduction) {
        return notFound(res, 'Dedução não encontrada');
      }
      res.json(deduction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar dedução';
      return badRequest(res, message);
    }
  },

  async deleteDeduction(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteDeduction(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar dedução';
      return badRequest(res, message);
    }
  },

  // ===== ALERTS =====

  async createAlert(req: Request, res: Response) {
    try {
      const { exercise_id, alert_type, severity, message, related_id } = req.body;

      if (!exercise_id || !alert_type || !message) {
        return badRequest(res, 'Campos obrigatórios: exercise_id, alert_type, message');
      }

      const userId = (req as any).user?.id;
      const alert = await irpfService.createAlert(exercise_id, {
        exercise_id,
        alert_type,
        severity: severity || 'info',
        message,
        related_id,
        is_resolved: false,
      }, userId);

      res.status(201).json(alert);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar alerta';
      return badRequest(res, message);
    }
  },

  async getAlerts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const alerts = await irpfService.getAlerts(req.params.exercise_id, userId);
      res.json(alerts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar alertas';
      return badRequest(res, message);
    }
  },

  async getAlertById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const alert = await irpfService.getAlertById(req.params.id, userId);
      if (!alert) {
        return notFound(res, 'Alerta não encontrado');
      }
      res.json(alert);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar alerta';
      return badRequest(res, message);
    }
  },

  async updateAlert(req: Request, res: Response) {
    try {
      const { is_resolved } = req.body;
      const userId = (req as any).user?.id;
      const alert = await irpfService.updateAlert(req.params.id, { is_resolved } as any, userId);

      if (!alert) {
        return notFound(res, 'Alerta não encontrado');
      }
      res.json(alert);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar alerta';
      return badRequest(res, message);
    }
  },

  async deleteAlert(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await irpfService.deleteAlert(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar alerta';
      return badRequest(res, message);
    }
  },

  // ===== RULES =====

  async createRule(req: Request, res: Response) {
    try {
      const { year, rule_type, rule_name, rule_value, description, source_url, source_date } = req.body;

      if (!year || !rule_type || !rule_name) {
        return badRequest(res, 'Campos obrigatórios: year, rule_type, rule_name');
      }

      const rule = await irpfService.createRule({
        year,
        rule_type,
        rule_name,
        rule_value,
        description,
        source_url,
        source_date,
        is_active: true,
      });

      res.status(201).json(rule);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar regra';
      return badRequest(res, message);
    }
  },

  async getRulesByYear(req: Request, res: Response) {
    try {
      const rules = await irpfService.getRulesByYear(Number(req.params.year));
      res.json(rules);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar regras';
      return badRequest(res, message);
    }
  },

  // ===== DOCUMENT PROCESSING =====

  async processDocument(req: Request, res: Response) {
    try {
      const { document_id, content } = req.body;

      if (!document_id || !content) {
        return badRequest(res, 'Campos obrigatórios: document_id, content');
      }

      const userId = (req as any).user?.id;
      // Obter documento
      const document = await irpfService.getDocumentById(document_id, userId);
      if (!document) {
        return notFound(res, 'Documento não encontrado');
      }

      // Processar com document reader
      const result = await documentReaderManager.extract(content, document.filename, document.mime_type);

      // Atualizar documento com dados extraídos
      await irpfService.updateDocument(document_id, {
        extracted_data: JSON.stringify(result.fields),
        confidence_score: result.confidence,
        status: 'extracted',
        document_type: result.documentType,
        extraction_progress: 100,
      }, userId);

      // Gerar alertas se necessário
      await taxIntelligenceService.generateAlerts(document.exercise_id, userId);

      res.json({
        document_id,
        extraction: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar documento';
      logger.error('Erro no processamento de documento:', message);
      return badRequest(res, message);
    }
  },

  async reviewDocumentExtraction(req: Request, res: Response) {
    try {
      const { document_id, reviewed_data } = req.body;

      if (!document_id) {
        return badRequest(res, 'document_id é obrigatório');
      }

      const userId = (req as any).user?.id;
      // Obter documento
      const document = await irpfService.getDocumentById(document_id, userId);
      if (!document) {
        return notFound(res, 'Documento não encontrado');
      }

      // Atualizar documento como verificado
      await irpfService.updateDocument(document_id, {
        extracted_data: JSON.stringify(reviewed_data || document.extracted_data),
        is_verified: true,
        status: 'extracted',
      }, userId);

      // Processar rendimentos extraídos se for holerite
      if (document.document_type === 'holerite' && reviewed_data) {
        const fields = Array.isArray(reviewed_data) ? reviewed_data : [];

        for (const field of fields) {
          if (field.name === 'salario_bruto' && field.value) {
            const month = this.extractMonth(document.filename);

            const income = await irpfService.createIncome(document.exercise_id, {
              exercise_id: document.exercise_id,
              document_id,
              income_type: 'salario',
              description: `Salário bruto - ${document.filename}`,
              amount: field.value,
              month,
              source: 'extracted_holerite',
              confidence_score: Math.min(field.confidence || 85, 100),
              is_verified: false,
            }, userId);

            // Criar linkage com financeiro se houver
            // (Este é apenas um exemplo - em produção haveria lógica mais sofisticada)
          }
        }
      }

      // Regenerar alertas
      await taxIntelligenceService.generateAlerts(document.exercise_id, userId);

      res.json({ success: true, document_id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao revisar extração';
      logger.error('Erro na revisão de extração:', message);
      return badRequest(res, message);
    }
  },

  // ===== TAX INTELLIGENCE =====

  async generateExerciseAlerts(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const userId = (req as any).user?.id;
      await taxIntelligenceService.generateAlerts(exerciseId, userId);

      const alerts = taxIntelligenceService.getAlerts(exerciseId, userId);

      res.json({
        exercise_id: exerciseId,
        alerts_count: alerts.length,
        alerts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar alertas';
      logger.error('Erro ao gerar alertas:', message);
      return badRequest(res, message);
    }
  },

  async getPendingAlerts(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const userId = (req as any).user?.id;
      const alerts = taxIntelligenceService.getPendingAlerts(exerciseId, userId);

      res.json(alerts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar alertas';
      return badRequest(res, message);
    }
  },

  async resolveAlert(req: Request, res: Response) {
    try {
      const alertId = req.params.alert_id;

      if (!alertId) {
        return badRequest(res, 'alert_id é obrigatório');
      }

      taxIntelligenceService.resolveAlert(alertId);

      res.json({ success: true, alert_id: alertId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao resolver alerta';
      return badRequest(res, message);
    }
  },

  // ===== FINANCIAL INTEGRATION =====

  async linkIncomeToFinancial(req: Request, res: Response) {
    try {
      const { income_id, financial_history_id } = req.body;

      if (!income_id || !financial_history_id) {
        return badRequest(res, 'Campos obrigatórios: income_id, financial_history_id');
      }

      const userId = (req as any).user?.id;
      const linkageId = await financialIntegrationService.linkIncomeToFinancial(
        income_id,
        financial_history_id,
        userId
      );

      res.status(201).json({ linkage_id: linkageId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao vincular';
      return badRequest(res, message);
    }
  },

  async getExerciseSummary(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;
      const userId = (req as any).user?.id;

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const exercise = await irpfService.getExerciseById(exerciseId, userId);
      if (!exercise) {
        return notFound(res, 'Exercício não encontrado');
      }
      const documents = await irpfService.getDocuments(exerciseId, userId);
      const incomes = await irpfService.getIncomes(exerciseId, userId);
      const assets = await irpfService.getAssets(exerciseId, userId);
      const dependents = await irpfService.getDependents(exerciseId, userId);
      const deductions = await irpfService.getDeductions(exerciseId, userId);
      const alerts = taxIntelligenceService.getPendingAlerts(exerciseId);

      res.json({
        exercise,
        summary: {
          total_documents: documents.length,
          documents_verified: documents.filter((d: any) => d.is_verified).length,
          total_income: incomes.reduce((sum: number, i: any) => sum + i.amount, 0),
          income_verified: incomes.filter((i: any) => i.is_verified).length,
          total_assets: assets.reduce((sum: number, a: any) => sum + a.value, 0),
          total_deductions: deductions.reduce((sum: number, d: any) => sum + d.amount, 0),
          total_dependents: dependents.length,
          pending_alerts: alerts.length,
          alerts_by_severity: {
            critical: alerts.filter((a: any) => a.severity === 'critical').length,
            error: alerts.filter((a: any) => a.severity === 'error').length,
            warning: alerts.filter((a: any) => a.severity === 'warning').length,
            info: alerts.filter((a: any) => a.severity === 'info').length,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao obter resumo';
      return badRequest(res, message);
    }
  },

  /**
   * Método auxiliar para extrair mês do nome do arquivo
   */
  extractMonth(filename: string): number | undefined {
    const match = filename.match(/(\d{1,2})/);
    if (match) {
      const month = parseInt(match[1]);
      if (month >= 1 && month <= 12) {
        return month;
      }
    }
    return undefined;
  },

  // ===== CONSOLIDATION =====

  async getConsolidation(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const userId = (req as any).user?.id;
      const incomes = await irpfService.getIncomes(exerciseId, userId);
      const holeriteIncomes = incomes.filter((i: any) => i.source === 'extracted_holerite');

      // Consolidate by month
      const monthlyData: { [key: number]: any } = {};
      for (let m = 1; m <= 12; m++) {
        monthlyData[m] = {
          month: m,
          items: [],
          total_bruto: 0,
          total_inss: 0,
          total_irrf: 0,
          total_fgts: 0,
          total_liquido: 0,
        };
      }

      holeriteIncomes.forEach((income: any) => {
        if (income.month && monthlyData[income.month]) {
          monthlyData[income.month].items.push(income);
          monthlyData[income.month].total_bruto += income.amount || 0;
          monthlyData[income.month].total_liquido += income.amount || 0;
        }
      });

      const consolidation = {
        year,
        exercise_id: exerciseId,
        months_worked: holeriteIncomes.length > 0 ? 12 : 0,
        months_data: Object.values(monthlyData),
        totals: {
          total_bruto: incomes.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
          total_items: incomes.length,
          confidence: incomes.length > 0 ? 85 : 0,
        },
      };

      res.json(consolidation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao obter consolidação';
      return badRequest(res, message);
    }
  },

  // ===== DUPLICATE DETECTION =====

  async checkDuplicate(req: Request, res: Response) {
    try {
      const { exercise_id, document_id } = req.params;
      const { competencia, cpf, cnpj, document_hash } = req.body;

      if (!exercise_id) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const userId = (req as any).user?.id;
      const documents = await irpfService.getDocuments(exercise_id, userId);
      const duplicates: any[] = [];

      if (document_hash) {
        // Check hash
        duplicates.push(...documents.filter((d: any) => d.file_hash === document_hash));
      }

      if (competencia && (cpf || cnpj)) {
        // Check competência + CPF/CNPJ
        const extracted = documents.filter((d: any) => {
          try {
            const data = JSON.parse(d.extracted_data || '{}');
            const compMatch = data.competencia === competencia || d.document_type === 'holerite';
            const identifierMatch = cpf ? data.cpf === cpf : cnpj ? data.cnpj === cnpj : false;
            return compMatch && identifierMatch;
          } catch {
            return false;
          }
        });
        duplicates.push(...extracted);
      }

      res.json({
        is_duplicate: duplicates.length > 0,
        duplicates: duplicates.map((d: any) => ({
          id: d.id,
          type: d.document_type,
          created_at: d.created_at,
          confidence: d.confidence_score,
        })),
        total_found: duplicates.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar duplicidade';
      return badRequest(res, message);
    }
  },

  // ===== DASHBOARD =====

  async getDashboardData(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;
      const userId = (req as any).user?.id;

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      const exercise = await irpfService.getExerciseById(exerciseId, userId);
      if (!exercise) {
        return notFound(res, 'Exercício não encontrado');
      }

      // Get all data
      const documents = await irpfService.getDocuments(exerciseId, userId);
      const incomes = await irpfService.getIncomes(exerciseId, userId);
      const assets = await irpfService.getAssets(exerciseId, userId);
      const dependents = await irpfService.getDependents(exerciseId, userId);
      const deductions = await irpfService.getDeductions(exerciseId, userId);
      const alerts = await irpfService.getAlerts(exerciseId, userId);

      // Calculate real metrics
      const holeriteCount = documents.filter((d: any) => d.document_type === 'holerite').length;
      const processedDocs = documents.filter((d: any) => d.status === 'extracted').length;
      const pendingReview = documents.filter((d: any) => d.status === 'pending').length;
      const withErrors = documents.filter((d: any) => d.status === 'error').length;

      const totalIncome = incomes.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
      const totalDeductions = deductions.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      // Find missing months
      const months = new Set<number>();
      incomes.forEach((i: any) => {
        if (i.month) months.add(i.month);
      });
      const missingMonths: number[] = [];
      for (let m = 1; m <= 12; m++) {
        if (!months.has(m)) {
          missingMonths.push(m);
        }
      }

      // Find low confidence documents
      const lowConfidence = documents.filter((d: any) => d.confidence_score && d.confidence_score < 70);

      // Find duplicate candidates
      const duplicateCandidates = documents.filter((d: any) => {
        const same = documents.filter((d2: any) => {
          if (d.id === d2.id) return false;
          try {
            const data1 = JSON.parse(d.extracted_data || '{}');
            const data2 = JSON.parse(d2.extracted_data || '{}');
            return data1.competencia === data2.competencia && (data1.cpf === data2.cpf || data1.cnpj === data2.cnpj);
          } catch {
            return false;
          }
        });
        return same.length > 0;
      });

      const dashboard = {
        exercise: {
          id: exercise.id,
          year: exercise.year,
          created_at: exercise.created_at,
        },
        documents: {
          total: documents.length,
          processed: processedDocs,
          pending_review: pendingReview,
          with_errors: withErrors,
          holerite_count: holeriteCount,
        },
        income: {
          total: totalIncome,
          items_count: incomes.length,
          verified_count: incomes.filter((i: any) => i.is_verified).length,
        },
        assets: {
          total: totalAssets,
          items_count: assets.length,
        },
        dependents: {
          total: dependents.length,
        },
        deductions: {
          total: totalDeductions,
          items_count: deductions.length,
          verified_count: deductions.filter((d: any) => d.is_verified).length,
        },
        alerts: {
          total: alerts.length,
          critical: alerts.filter((a: any) => a.severity === 'critical').length,
          error: alerts.filter((a: any) => a.severity === 'error').length,
          warning: alerts.filter((a: any) => a.severity === 'warning').length,
          info: alerts.filter((a: any) => a.severity === 'info').length,
        },
        pending_actions: {
          missing_months: missingMonths,
          missing_months_count: missingMonths.length,
          low_confidence_docs: lowConfidence.length,
          duplicate_candidates: duplicateCandidates.length,
          documents_awaiting_review: pendingReview,
        },
      };

      res.json(dashboard);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao obter dashboard';
      logger.error('Erro no dashboard:', message);
      return badRequest(res, message);
    }
  },

  // ===== INTELLIGENT ASSISTANT =====

  async getAssistantAnalysis(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;

      if (!exerciseId) {
        return badRequest(res, 'exercise_id é obrigatório');
      }

      // Verify exercise exists
      const userId = (req as any).user?.id;
      const exercise = await irpfService.getExerciseById(exerciseId, userId);
      if (!exercise) {
        return notFound(res, 'Exercício não encontrado');
      }

      // Get database instance from app context
      const db = (res.app as any).get('db');
      if (!db) {
        logger.error('Database instance não disponível');
        return badRequest(res, 'Erro ao acessar o banco de dados');
      }

      // Analyze using Assistant Service
      const assistantService = new AssistantService(db);
      const analysis = await assistantService.analyze(exerciseId, userId);

      // Run validation/conference engine and attach results
      const validationService = new IRPFValidationService();
      const validation = await validationService.validateExercise(exerciseId, userId);

      res.json({ ...analysis, validation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao executar Assistente IRPF';
      logger.error('Erro no assistente:', message);
      return badRequest(res, message);
    }
  },

  // ===== CORRECTIONS & VALIDATIONS =====

  async getDocumentCorrections(req: Request, res: Response) {
    try {
      const documentId = req.params.documentId;
      if (!documentId) return badRequest(res, 'documentId é obrigatório');
      const corrections = correctionsRepository.getByDocument(documentId);
      res.json(corrections);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar correções';
      return badRequest(res, message);
    }
  },

  async getExerciseCorrections(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exerciseId;
      if (!exerciseId) return badRequest(res, 'exerciseId é obrigatório');
      const corrections = correctionsRepository.getByExercise(exerciseId);
      res.json(corrections);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar correções por exercício';
      return badRequest(res, message);
    }
  },

  async getValidations(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;
      if (!exerciseId) return badRequest(res, 'exercise_id é obrigatório');
      const validations = validationsRepository.getByExercise(exerciseId);
      res.json(validations);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar validações';
      return badRequest(res, message);
    }
  },

  async updateValidationStatus(req: Request, res: Response) {
    try {
      const validationId = req.params.validation_id;
      const { status } = req.body;
      if (!validationId || !status) return badRequest(res, 'validation_id e status são obrigatórios');
      const updated = validationsRepository.updateStatus(validationId, status);
      res.json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar validação';
      return badRequest(res, message);
    }
  },

  async rerunValidations(req: Request, res: Response) {
    try {
      const exerciseId = req.params.exercise_id;
      if (!exerciseId) return badRequest(res, 'exercise_id é obrigatório');
      // Re-execute validation engine (it upserts validations)
      const validationService = new IRPFValidationService();
      const userId = (req as any).user?.id;
      const result = await validationService.validateExercise(exerciseId, userId);
      const validations = validationsRepository.getByExercise(exerciseId);
      res.json({ ran_at: new Date().toISOString(), summary: result.summary, validations });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reexecutar validações';
      return badRequest(res, message);
    }
  },
};
