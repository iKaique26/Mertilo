/**
 * Document Reader Abstraction
 * Processa diferentes tipos de documentos e extrai dados
 */

import { logger } from '../utils/logger.js';

export interface ExtractedField {
  name: string;
  value: any;
  confidence: number;
  source?: string;
  page?: number;
}

export interface DocumentExtractionResult {
  documentType: string;
  fields: ExtractedField[];
  rawText?: string;
  confidence: number;
  errors?: string[];
}

/**
 * Interface base para leitores de documento
 */
export interface IDocumentReader {
  canRead(filename: string, mimeType: string): boolean;
  extract(content: string, filename: string): Promise<DocumentExtractionResult>;
}

/**
 * Leitor genérico de texto
 */
export class TextExtractor implements IDocumentReader {
  canRead(filename: string, mimeType: string): boolean {
    return mimeType === 'text/csv' || mimeType === 'text/plain';
  }

  async extract(content: string, filename: string): Promise<DocumentExtractionResult> {
    return {
      documentType: 'text',
      fields: [],
      rawText: content,
      confidence: 50,
    };
  }
}

/**
 * Leitor de Holerite (Contracheque)
 * Extrai dados de salário com suporte a diferentes layouts
 */
export class HoleriteReader implements IDocumentReader {
  canRead(filename: string, mimeType: string): boolean {
    const nameLower = filename.toLowerCase();
    return nameLower.includes('holerite') || 
           nameLower.includes('contracheque') || 
           nameLower.includes('folha') ||
           nameLower.includes('payslip');
  }

  async extract(content: string, filename: string): Promise<DocumentExtractionResult> {
    const fields: ExtractedField[] = [];
    const errors: string[] = [];

    try {
      // Extrair competência (mês/ano)
      const competenciaMatch = content.match(/competência|mes|período|ref[.]?|de\s*(\d{2}\/\d{4})/i);
      if (competenciaMatch) {
        const monthYear = content.match(/(\d{2})\/(\d{4})/);
        if (monthYear) {
          fields.push({
            name: 'competencia',
            value: `${monthYear[1]}/${monthYear[2]}`,
            confidence: 95,
            source: 'header_match',
          });
        }
      }

      // Extrair CPF
      const cpfMatch = content.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
      if (cpfMatch) {
        fields.push({
          name: 'cpf',
          value: cpfMatch[0],
          confidence: 100,
          source: 'pattern_match',
        });
      }

      // Extrair CNPJ
      const cnpjMatch = content.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
      if (cnpjMatch) {
        fields.push({
          name: 'cnpj',
          value: cnpjMatch[0],
          confidence: 100,
          source: 'pattern_match',
        });
      }

      // Extrair salário bruto
      const bruttoMatch = this.extractAmount(content, ['salário bruto', 'provento total', 'vencimento', 'base de cálculo']);
      if (bruttoMatch) {
        fields.push({
          name: 'salario_bruto',
          value: bruttoMatch.value,
          confidence: bruttoMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair INSS
      const inssMatch = this.extractAmount(content, ['inss', 'contribuição sindical']);
      if (inssMatch) {
        fields.push({
          name: 'inss',
          value: inssMatch.value,
          confidence: inssMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair IRRF
      const irrfMatch = this.extractAmount(content, ['irrf', 'ir']);
      if (irrfMatch) {
        fields.push({
          name: 'irrf',
          value: irrfMatch.value,
          confidence: irrfMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair FGTS
      const fgtsMatch = this.extractAmount(content, ['fgts', 'fundo de garantia']);
      if (fgtsMatch) {
        fields.push({
          name: 'fgts',
          value: fgtsMatch.value,
          confidence: fgtsMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Vale-transporte
      const valeTransMatch = this.extractAmount(content, ['vale.*transporte', 'vt']);
      if (valeTransMatch) {
        fields.push({
          name: 'vale_transporte',
          value: valeTransMatch.value,
          confidence: valeTransMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Vale-alimentação
      const valeAlimMatch = this.extractAmount(content, ['vale.*alimenta', 'va']);
      if (valeAlimMatch) {
        fields.push({
          name: 'vale_alimentacao',
          value: valeAlimMatch.value,
          confidence: valeAlimMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Plano de Saúde
      const planosaude = this.extractAmount(content, ['plano.*saúde', 'saúde', 'health']);
      if (planosaude) {
        fields.push({
          name: 'plano_saude',
          value: planosaude.value,
          confidence: planosaude.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Horas Extras
      const horasExtras = this.extractAmount(content, ['horas? extras?', 'adicional noturno']);
      if (horasExtras) {
        fields.push({
          name: 'horas_extras',
          value: horasExtras.value,
          confidence: horasExtras.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Bonificação/Comissão
      const bonificacao = this.extractAmount(content, ['bonificação', 'comissão', 'bonus', 'comis']);
      if (bonificacao) {
        fields.push({
          name: 'bonificacao',
          value: bonificacao.value,
          confidence: bonificacao.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair 13º Salário
      const decimo = this.extractAmount(content, ['13º', 'décimo.*terceiro', 'gratificação']);
      if (decimo) {
        fields.push({
          name: 'decimo_terceiro',
          value: decimo.value,
          confidence: decimo.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair Salário Líquido
      const liquidoMatch = this.extractAmount(content, ['salário líquido', 'liquido', 'salário a receber', 'líquido', 'total']);
      if (liquidoMatch) {
        fields.push({
          name: 'salario_liquido',
          value: liquidoMatch.value,
          confidence: liquidoMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Calcular confiança média
      const avgConfidence = fields.length > 0 
        ? Math.round(fields.reduce((acc, f) => acc + f.confidence, 0) / fields.length)
        : 0;

      return {
        documentType: 'holerite',
        fields,
        rawText: content,
        confidence: avgConfidence,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      logger.error('Erro ao processar holerite:', error);
      return {
        documentType: 'holerite',
        fields: [],
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Erro ao processar'],
      };
    }
  }

  private extractAmount(content: string, patterns: string[]): { value: number; confidence: number } | null {
    for (const pattern of patterns) {
      // Procurar padrão seguido de valores monetários
      const regex = new RegExp(`${pattern}[:\\s]+R?\\$?\\s*([\\d.,]+)`, 'i');
      const match = content.match(regex);
      if (match) {
        const value = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
        if (!isNaN(value)) {
          return { value, confidence: 85 };
        }
      }
    }
    return null;
  }
}

/**
 * Leitor de Informe de Rendimentos
 */
export class RendimentosReader implements IDocumentReader {
  canRead(filename: string, mimeType: string): boolean {
    const nameLower = filename.toLowerCase();
    return nameLower.includes('informe') || 
           nameLower.includes('rendimento') ||
           nameLower.includes('income') ||
           nameLower.includes('statement');
  }

  async extract(content: string, filename: string): Promise<DocumentExtractionResult> {
    const fields: ExtractedField[] = [];

    try {
      // Extrair CNPJ
      const cnpjMatch = content.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
      if (cnpjMatch) {
        fields.push({
          name: 'cnpj_fonte',
          value: cnpjMatch[0],
          confidence: 100,
          source: 'pattern_match',
        });
      }

      // Extrair ano
      const anoMatch = content.match(/(20\d{2})/);
      if (anoMatch) {
        fields.push({
          name: 'ano_calendario',
          value: parseInt(anoMatch[0]),
          confidence: 95,
          source: 'pattern_match',
        });
      }

      // Extrair rendimento tributável
      const tributMatch = this.extractAmount(content, ['rendimento tributável', 'tributável', 'remuneração']);
      if (tributMatch) {
        fields.push({
          name: 'rendimento_tributavel',
          value: tributMatch.value,
          confidence: tributMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair rendimento isento
      const isentoMatch = this.extractAmount(content, ['rendimento isento', 'isento']);
      if (isentoMatch) {
        fields.push({
          name: 'rendimento_isento',
          value: isentoMatch.value,
          confidence: isentoMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair IRRF
      const irrfMatch = this.extractAmount(content, ['irrf', 'imposto retido', 'ir retido']);
      if (irrfMatch) {
        fields.push({
          name: 'irrf',
          value: irrfMatch.value,
          confidence: irrfMatch.confidence,
          source: 'pattern_match',
        });
      }

      // Extrair INSS
      const inssMatch = this.extractAmount(content, ['inss', 'contribuição']);
      if (inssMatch) {
        fields.push({
          name: 'inss',
          value: inssMatch.value,
          confidence: inssMatch.confidence,
          source: 'pattern_match',
        });
      }

      const avgConfidence = fields.length > 0 
        ? Math.round(fields.reduce((acc, f) => acc + f.confidence, 0) / fields.length)
        : 0;

      return {
        documentType: 'rendimentos',
        fields,
        rawText: content,
        confidence: avgConfidence,
      };
    } catch (error) {
      logger.error('Erro ao processar informe de rendimentos:', error);
      return {
        documentType: 'rendimentos',
        fields: [],
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Erro ao processar'],
      };
    }
  }

  private extractAmount(content: string, patterns: string[]): { value: number; confidence: number } | null {
    for (const pattern of patterns) {
      const regex = new RegExp(`${pattern}[:\\s]+R?\\$?\\s*([\\d.,]+)`, 'i');
      const match = content.match(regex);
      if (match) {
        const value = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
        if (!isNaN(value)) {
          return { value, confidence: 90 };
        }
      }
    }
    return null;
  }
}

/**
 * Gerenciador de leitores de documento
 * Registra e coordena diferentes leitores
 */
export class DocumentReaderManager {
  private readers: IDocumentReader[] = [];

  constructor() {
    // Registrar leitores padrão
    this.register(new HoleriteReader());
    this.register(new RendimentosReader());
    this.register(new TextExtractor());
  }

  register(reader: IDocumentReader): void {
    this.readers.push(reader);
  }

  async extract(
    content: string,
    filename: string,
    mimeType: string
  ): Promise<DocumentExtractionResult> {
    // Encontrar leitor apropriado
    for (const reader of this.readers) {
      if (reader.canRead(filename, mimeType)) {
        return await reader.extract(content, filename);
      }
    }

    // Fallback: tentar como texto genérico
    return {
      documentType: 'unknown',
      fields: [],
      confidence: 0,
      errors: ['Tipo de documento não suportado'],
    };
  }
}

// Instância global
export const documentReaderManager = new DocumentReaderManager();
