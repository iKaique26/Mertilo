/**
 * File Processor Service
 * Comprehensive document processing with OCR, PDF handling, and classification
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { readHolerite, validateHoleriteData, type HoleriteData } from './holerite-reader.js';
import { extractTextFromImage, detectIfScannedPDF, type OCRResult } from './ocr-service.js';

export interface ExtractedField {
  name: string;
  value: string | number;
  confidence: number;
  source: string;
  page?: number;
}

export interface FileExtractionResult {
  success: boolean;
  documentType:
    | 'holerite'
    | 'income_statement'
    | 'bank_statement'
    | 'medical_receipt'
    | 'dental_receipt'
    | 'education_receipt'
    | 'investment'
    | 'vehicle_document'
    | 'property_document'
    | 'darf'
    | 'unknown';
  rawText: string;
  fields: ExtractedField[];
  holeriteData?: HoleriteData;
  confidence: number;
  errors: string[];
  warnings: string[];
  processedAt: string;
  isScanned?: boolean;
  ocrUsed?: boolean;
}

/**
 * Main entry point for file processing
 */
export async function processFile(filePath: string, mimeType: string): Promise<FileExtractionResult> {
  const result: FileExtractionResult = {
    success: false,
    documentType: 'unknown',
    rawText: '',
    fields: [],
    confidence: 0,
    errors: [],
    warnings: [],
    processedAt: new Date().toISOString(),
  };

  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      result.errors.push(`Arquivo não encontrado: ${filePath}`);
      return result;
    }

    let rawText = '';
    let ocrUsed = false;

    // Processar PDF
    if (mimeType === 'application/pdf') {
      const pdfResult = await extractTextFromPDF(filePath);
      rawText = pdfResult.text;
      result.isScanned = pdfResult.isScanned;

      // If scanned PDF, use OCR for better extraction
      if (pdfResult.isScanned && (!rawText || rawText.trim().length < 50)) {
        logger.info('Iniciando OCR para PDF escaneado...');
        try {
          const ocrResult = await extractTextFromImage(filePath);
          if (ocrResult.success) {
            rawText = ocrResult.text;
            ocrUsed = true;
            result.warnings = result.warnings.filter(w => !w.includes('OCR será necessário'));
            result.warnings.push('OCR utilizado para extrair texto de PDF escaneado');
            logger.info('OCR concluído para PDF escaneado com sucesso');
          } else {
            result.warnings.push('PDF escaneado - OCR tentado mas falhou: ' + (ocrResult.errors[0] || 'erro desconhecido'));
          }
        } catch (error) {
          result.warnings.push('OCR indisponível para PDF escaneado: ' + (error instanceof Error ? error.message : 'erro desconhecido'));
        }
      } else if (!rawText || rawText.trim().length === 0) {
        result.warnings.push('Nenhum texto foi extraído do PDF - confirme com o usuário');
      }
    }
    // Processar imagens
    else if (['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
      const ocrResult = await extractTextFromImage(filePath);
      rawText = ocrResult.text;
      ocrUsed = ocrResult.success;

      if (!ocrResult.success) {
        result.errors.push(
          'OCR falhou. Motivo: ' + (ocrResult.errors[0] || 'Tesseract.js não disponível')
        );
        result.warnings.push('Imagem não pode ser processada sem OCR');
      }
    }
    // Texto plano e CSV
    else if (
      ['text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
        mimeType
      )
    ) {
      rawText = fs.readFileSync(filePath, 'utf-8');
    } else {
      result.errors.push(`Tipo de arquivo não suportado: ${mimeType}`);
      return result;
    }

    // Validate text extraction
    if (!rawText || rawText.trim().length === 0) {
      result.errors.push('Nenhum texto foi extraído do arquivo');
      return result;
    }

    result.rawText = rawText;
    result.success = true;
    result.ocrUsed = ocrUsed;

    // Identify document type with confidence
    const docTypeResult = identifyDocumentType(rawText);
    result.documentType = docTypeResult.type;
    const typeConfidence = docTypeResult.confidence;

    if (typeConfidence < 50) {
      result.warnings.push('Tipo de documento identificado com baixa confiança - confirmação do usuário recomendada');
    }

    // Extract based on type
    if (result.documentType === 'holerite') {
      const holeriteData = readHolerite(rawText);
      result.holeriteData = holeriteData;
      result.fields = holeriteDataToFields(holeriteData);
      result.confidence = holeriteData.confidence;
      result.errors.push(...holeriteData.errors);

      // Validate
      const validation = validateHoleriteData(holeriteData);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        result.confidence = Math.max(0, result.confidence - 30);
      }
    } else if (result.documentType === 'income_statement') {
      const incomeFields = extractIncomeStatementFields(rawText);
      result.fields = incomeFields;
      result.confidence = calculateConfidence(incomeFields);
    } else if (result.documentType === 'bank_statement') {
      const bankFields = extractBankStatementFields(rawText);
      result.fields = bankFields;
      result.confidence = calculateConfidence(bankFields);
    } else if (result.documentType === 'medical_receipt' || result.documentType === 'dental_receipt') {
      const medicalFields = extractMedicalFields(rawText);
      result.fields = medicalFields;
      result.confidence = calculateConfidence(medicalFields);
    } else {
      // Generic text extraction
      result.fields = extractGenericFields(rawText);
      result.confidence = Math.min(40, calculateConfidence(result.fields));
      result.warnings.push('Documento não identificado - tipo pode estar incorreto');
    }

    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
    logger.error('Erro ao processar arquivo:', error);
    return result;
  }
}

/**
 * Extract text from PDF with detection of scanned vs text-based
 */
async function extractTextFromPDF(filePath: string): Promise<{ text: string; isScanned: boolean }> {
  try {
    // Read PDF as buffer
    const buffer = fs.readFileSync(filePath);
    
    // Try to extract text from PDF stream
    // PDFs have text objects that can be parsed
    const text = extractTextFromPDFBuffer(buffer);
    
    // If very little text extracted, likely a scanned PDF
    const isScanned = text.trim().length < 100;
    
    if (isScanned) {
      logger.info('PDF detectado como escaneado - OCR será utilizado');
    } else {
      logger.info(`PDF com texto extraído: ${text.length} caracteres`);
    }
    
    return { text, isScanned };
  } catch (error) {
    logger.error('Erro ao ler PDF:', error);
    throw new Error('Erro ao processar PDF');
  }
}

/**
 * Simple PDF text extraction from buffer
 * Extracts text objects from PDF stream
 */
function extractTextFromPDFBuffer(buffer: Buffer): string {
  try {
    const pdfString = buffer.toString('binary');
    const textMatches: string[] = [];
    
    // Regex patterns to extract text from PDF content streams
    // PDF text can appear in BT...ET blocks
    const btPattern = /BT([\s\S]*?)ET/g;
    let match;
    
    while ((match = btPattern.exec(pdfString)) !== null) {
      const block = match[1];
      
      // Extract text from Tj, TJ operators
      const tjPattern = /\((.*?)\)\s*T[jJ]/g;
      let tjMatch;
      while ((tjMatch = tjPattern.exec(block)) !== null) {
        let text = tjMatch[1];
        // Decode escaped characters
        text = text.replace(/\\(.)/g, (_, char) => {
          const codes: { [key: string]: string } = {
            'n': '\n',
            'r': '\r',
            't': '\t',
            '\\': '\\',
            '(': '(',
            ')': ')'
          };
          return codes[char] || char;
        });
        if (text.trim()) {
          textMatches.push(text);
        }
      }
      
      // Also try to extract from hex-encoded text
      const hexPattern = /<([\dA-Fa-f]+)>\s*T[jJ]/g;
      while ((tjMatch = hexPattern.exec(block)) !== null) {
        try {
          const hex = tjMatch[1];
          const text = Buffer.from(hex, 'hex').toString('latin1');
          if (text.trim()) {
            textMatches.push(text);
          }
        } catch {
          // Skip invalid hex
        }
      }
    }
    
    return textMatches.join(' ').substring(0, 50000); // Limit to 50k chars
  } catch {
    return '';
  }
}

interface DocumentTypeResult {
  type: FileExtractionResult['documentType'];
  confidence: number;
}

/**
 * Identify document type based on content analysis
 */
function identifyDocumentType(text: string): DocumentTypeResult {
  const lowerText = text.toLowerCase();

  // Holerite / Contracheque (highest priority due to core feature)
  if (
    lowerText.includes('holerite') ||
    lowerText.includes('contracheque') ||
    lowerText.includes('folha de pagamento') ||
    (lowerText.includes('salário bruto') && lowerText.includes('líquido')) ||
    (lowerText.includes('inss') && lowerText.includes('irrf') && lowerText.includes('bruto'))
  ) {
    return { type: 'holerite', confidence: 95 };
  }

  // Informe de Rendimentos
  if ((lowerText.includes('informe') && lowerText.includes('rendimento')) || lowerText.includes('irrf')) {
    return { type: 'income_statement', confidence: 90 };
  }

  // Bank Statement
  if (
    lowerText.includes('extrato') ||
    (lowerText.includes('saldo anterior') && lowerText.includes('saldo final')) ||
    (lowerText.includes('data') && lowerText.includes('débito') && lowerText.includes('crédito'))
  ) {
    return { type: 'bank_statement', confidence: 85 };
  }

  // Medical/Dental
  if (lowerText.includes('consultório') || lowerText.includes('consultoria médica') || lowerText.includes('médico')) {
    return { type: 'medical_receipt', confidence: 80 };
  }

  if (lowerText.includes('dentista') || lowerText.includes('consultório odontológico') || lowerText.includes('odontológ')) {
    return { type: 'dental_receipt', confidence: 80 };
  }

  // Education
  if (lowerText.includes('universidade') || lowerText.includes('faculdade') || lowerText.includes('escola') || lowerText.includes('tuição')) {
    return { type: 'education_receipt', confidence: 75 };
  }

  // Vehicle Document
  if (lowerText.includes('placa') || lowerText.includes('veículo') || lowerText.includes('registro'))  {
    return { type: 'vehicle_document', confidence: 70 };
  }

  // Property Document
  if (lowerText.includes('imóvel') || lowerText.includes('propriedade') || lowerText.includes('escritura')) {
    return { type: 'property_document', confidence: 70 };
  }

  // DARF
  if (lowerText.includes('darf') || lowerText.includes('documento de arrecadação')) {
    return { type: 'darf', confidence: 85 };
  }

  return { type: 'unknown', confidence: 30 };
}

/**
 * Convert HoleriteData to ExtractedField array
 */
function holeriteDataToFields(data: HoleriteData): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const fieldLabels: Record<string, string> = {
    nome: 'Nome',
    cpf: 'CPF',
    cnpj: 'CNPJ',
    empresa: 'Empresa',
    competencia: 'Competência',
    data_pagamento: 'Data Pagamento',
    salario_base: 'Salário Base',
    salario_bruto: 'Salário Bruto',
    inss: 'INSS',
    irrf: 'IRRF',
    fgts: 'FGTS',
    horas_extras: 'Horas Extras',
    adicional_noturno: 'Adicional Noturno',
    adicional_periculosidade: 'Periculosidade',
    adicional_insalubridade: 'Insalubridade',
    bonificacao: 'Bonificação',
    comissao: 'Comissão',
    ferias: 'Férias',
    decimo_terceiro: '13º Salário',
    vale_transporte: 'Vale Transporte',
    vale_alimentacao: 'Vale Alimentação',
    outros_proventos: 'Outros Proventos',
    outros_descontos: 'Outros Descontos',
    salario_liquido: 'Salário Líquido',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    const value = (data as any)[key];
    if (value !== undefined && value !== null && value !== '') {
      fields.push({
        name: label,
        value: typeof value === 'number' ? `R$ ${value.toFixed(2)}` : value,
        confidence: data.fields_found.includes(key) ? 85 + Math.random() * 10 : 60,
        source: 'holerite_reader',
      });
    }
  }

  return fields;
}

/**
 * Extract income statement fields
 */
function extractIncomeStatementFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const patterns: Record<string, RegExp> = {
    cnpj_fonte: /cnpj\s*(?:da\s+)?fonte\s*:?\s*([\d\.\-\/]+)/i,
    ano_calendario: /ano\s+(?:calendário|calend.rio)\s*:?\s*(\d{4})/i,
    rendimento_tributavel: /rendimento\s+(?:tributável|tribut.vel)\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    rendimento_isento: /rendimento\s+(?:isento|i\.?s\.?)\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    irrf: /irrf\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    inss: /inss\s*:?\s*r?\$?\s*([\d\.,]+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      fields.push({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: match[1].trim(),
        confidence: 85,
        source: 'regex_pattern',
      });
    }
  }

  return fields;
}

/**
 * Extract bank statement fields
 */
function extractBankStatementFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Procurar por padrões de transações
  const transactionPattern = /(\d{1,2}\/\d{1,2})\s+(.+?)\s+([\d\.,]+)/g;
  let match;
  let transactionCount = 0;

  while ((match = transactionPattern.exec(text)) !== null && transactionCount < 12) {
    fields.push({
      name: `Transação ${transactionCount + 1}`,
      value: `${match[1]} - ${match[2]}: R$ ${match[3]}`,
      confidence: 75,
      source: 'regex_pattern',
    });
    transactionCount++;
  }

  return fields;
}

/**
 * Extract medical/dental receipt fields
 */
function extractMedicalFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const patterns = [
    { label: 'Paciente', pattern: /paciente\s*:?\s*(.+?)(?=\n|cpf)/i },
    { label: 'CPF', pattern: /cpf\s*:?\s*(\d{3}\.\d{3}\.\d{3}-\d{2})/i },
    { label: 'Procedimento', pattern: /procedimento\s*:?\s*(.+?)(?=\n|valor)/i },
    { label: 'Valor', pattern: /r?\$?\s*([\d\.,]+)/ },
    { label: 'Data', pattern: /(\d{2}\/\d{2}\/\d{4})/ },
  ];

  for (const { label, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      fields.push({
        name: label,
        value: match[1],
        confidence: 75,
        source: 'medical_extraction',
      });
    }
  }

  return fields;
}

/**
 * Extract generic fields
 */
function extractGenericFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  const patterns = [
    { label: 'CPF', pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/ },
    { label: 'CNPJ', pattern: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/ },
    { label: 'Email', pattern: /[\w\.-]+@[\w\.-]+\.\w+/ },
    { label: 'Telefone', pattern: /\(\d{2}\)\s*\d{4,5}-\d{4}/ },
  ];

  for (const { label, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      fields.push({
        name: label,
        value: match[0],
        confidence: 75,
        source: 'generic_extraction',
      });
    }
  }

  return fields;
}

/**
 * Calculate confidence average
 */
function calculateConfidence(fields: ExtractedField[]): number {
  if (fields.length === 0) return 0;
  const sum = fields.reduce((acc, field) => acc + field.confidence, 0);
  return Math.round(sum / fields.length);
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(text: string): string {
  return text.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, 'CPF_MASKED').replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, 'CNPJ_MASKED');
}
