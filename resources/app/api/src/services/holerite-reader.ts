/**
 * Holerite Reader Service
 * Advanced holerite/payslip processing with multiple layout support
 */

import { logger } from '../utils/logger.js';

export interface HoleriteData {
  // Identification
  nome?: string;
  cpf?: string;
  cnpj?: string;
  empresa?: string;
  
  // Date/Competence
  competencia?: string; // MM/YYYY
  data_pagamento?: string;
  
  // Gross and Base
  salario_base?: number;
  salario_bruto?: number;
  
  // Deductions
  inss?: number;
  irrf?: number;
  fgts?: number;
  
  // Extras
  horas_extras?: number;
  adicional_noturno?: number;
  adicional_periculosidade?: number;
  adicional_insalubridade?: number;
  bonificacao?: number;
  comissao?: number;
  ferias?: number;
  decimo_terceiro?: number;
  
  // Other
  vale_transporte?: number;
  vale_alimentacao?: number;
  outros_proventos?: number;
  outros_descontos?: number;
  
  // Result
  salario_liquido?: number;
  
  // Metadata
  confidence: number;
  fields_found: string[];
  errors: string[];
}

interface FieldPattern {
  aliases: string[];
  pattern: RegExp[];
  type: 'currency' | 'date' | 'cpf' | 'cnpj' | 'text' | 'percent';
  required?: boolean;
}

const FIELD_PATTERNS: Record<string, FieldPattern> = {
  nome: {
    aliases: ['nome do funcionário', 'employee name', 'funcionário'],
    pattern: [/nome\s*(?:do\s+(?:funcionário|collaborador|employee))?\s*:?\s*([A-ZÁÉÍÓÚÃÕ\s]+?)(?=\n|$|cpf|matrícula)/i],
    type: 'text',
  },
  cpf: {
    aliases: ['cpf', 'cpf do funcionário', 'employee cpf'],
    pattern: [
      /cpf\s*:?\s*(\d{3}\.\d{3}\.\d{3}-\d{2})/i,
      /cpf\s*:?\s*(\d{11})/,
      /(\d{3}\.\d{3}\.\d{3}-\d{2})/,
    ],
    type: 'cpf',
  },
  cnpj: {
    aliases: ['cnpj', 'cnpj da empresa', 'company cnpj'],
    pattern: [
      /cnpj\s*:?\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i,
      /cnpj\s*:?\s*(\d{14})/,
    ],
    type: 'cnpj',
  },
  empresa: {
    aliases: ['empresa', 'company', 'razão social'],
    pattern: [/empresa\s*:?\s*(.+?)(?=\n|cnpj)/i, /razão\s+social\s*:?\s*(.+?)(?=\n|cnpj)/i],
    type: 'text',
  },
  competencia: {
    aliases: ['competência', 'período', 'mes', 'month', 'data base'],
    pattern: [
      /competência\s*:?\s*(\d{2}\/\d{4})/i,
      /período\s*:?\s*(\d{2}\/\d{4})/i,
      /mês\s+(?:de\s+)?(?:referência|competência)\s*:?\s*(\d{2}\/\d{4})/i,
    ],
    type: 'date',
    required: true,
  },
  data_pagamento: {
    aliases: ['data de pagamento', 'payment date', 'data pag'],
    pattern: [/data\s+(?:de\s+)?pagamento\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i],
    type: 'date',
  },
  salario_base: {
    aliases: ['salário base', 'base salary', 'sal. base'],
    pattern: [/salário\s+base\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  salario_bruto: {
    aliases: ['salário bruto', 'gross salary', 'total bruto', 'total de proventos'],
    pattern: [
      /salário\s+bruto\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /(?:total\s+de\s+)?proventos\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /bruto\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /total\s+bruto\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
    required: true,
  },
  inss: {
    aliases: ['inss', 'inss desconto', 'inss (-)', 'social security'],
    pattern: [
      /inss\s*(?:\(\d+%\))?\s*:?\s*-?\s*r?\$?\s*([\d\.,]+)/i,
      /(?:desc\.\s+)?inss\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
  },
  irrf: {
    aliases: ['irrf', 'ir', 'imposto de renda', 'income tax', 'ir (-)', 'irpf'],
    pattern: [
      /irrf?\s*(?:\(\d+%\))?\s*:?\s*-?\s*r?\$?\s*([\d\.,]+)/i,
      /(?:desc\.\s+)?ir\s*(?:\(\d+%\))?\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /imposto\s+de\s+renda\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
  },
  fgts: {
    aliases: ['fgts', 'fgts (8%)', 'severance fund'],
    pattern: [
      /fgts\s*(?:\([\d\.%]+\))?\s*:?\s*-?\s*r?\$?\s*([\d\.,]+)/i,
      /f\.g\.t\.s\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
  },
  horas_extras: {
    aliases: ['horas extras', 'overtime', 'hora extra', 'he'],
    pattern: [
      /horas?\s+extras?\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /he\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
  },
  adicional_noturno: {
    aliases: ['adicional noturno', 'night bonus', 'adic. noturno'],
    pattern: [/(?:adicional\s+)?noturno\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  adicional_periculosidade: {
    aliases: ['adicional periculosidade', 'danger bonus', 'periculosidade'],
    pattern: [/periculosidade\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  adicional_insalubridade: {
    aliases: ['adicional insalubridade', 'unhealthy work bonus', 'insalubridade'],
    pattern: [/insalubridade\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  bonificacao: {
    aliases: ['bonificação', 'bonus', 'bonif', 'gratificação'],
    pattern: [/bonifi?ca?ção\s*:?\s*r?\$?\s*([\d\.,]+)/i, /gratificação\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  comissao: {
    aliases: ['comissão', 'commission', 'comis.'],
    pattern: [/comiss?ã?o\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  ferias: {
    aliases: ['férias', 'vacation', 'férias'],
    pattern: [/férias?\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  decimo_terceiro: {
    aliases: ['13º', '13º salário', '13', 'thirteenth month', 'décimo terceiro'],
    pattern: [
      /13º?\s*(?:salário)?\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /décimo\s+terceiro\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
  },
  vale_transporte: {
    aliases: ['vale transporte', 'vt', 'transportation voucher'],
    pattern: [/v\.?\s*t\.?\s*:?\s*r?\$?\s*([\d\.,]+)/i, /vale\s+transporte\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  vale_alimentacao: {
    aliases: ['vale alimentação', 'va', 'food voucher', 'vale refeição'],
    pattern: [/v\.?\s*a\.?\s*:?\s*r?\$?\s*([\d\.,]+)/i, /vale\s+(?:alimentação|refei[çc]ão)\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  outros_proventos: {
    aliases: ['outros proventos', 'other income', 'demais proventos'],
    pattern: [/(?:outros?\s+)?proventos?\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  outros_descontos: {
    aliases: ['outros descontos', 'other deductions', 'demais descontos'],
    pattern: [/(?:outros?\s+)?descontos?\s*:?\s*r?\$?\s*([\d\.,]+)/i],
    type: 'currency',
  },
  salario_liquido: {
    aliases: ['salário líquido', 'net salary', 'líquido', 'a receber', 'total a receber'],
    pattern: [
      /salário\s+líquido\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /líquido\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /(?:total\s+)?a\s+receber\s*:?\s*r?\$?\s*([\d\.,]+)/i,
      /total\s+(?:líquido|a\s+receber)\s*:?\s*r?\$?\s*([\d\.,]+)/i,
    ],
    type: 'currency',
    required: true,
  },
};

export function readHolerite(text: string): HoleriteData {
  const data: HoleriteData = {
    confidence: 0,
    fields_found: [],
    errors: [],
  };

  if (!text || text.trim().length === 0) {
    data.errors.push('Arquivo vazio ou sem conteúdo');
    return data;
  }

  // Extract each field
  for (const [fieldKey, pattern] of Object.entries(FIELD_PATTERNS)) {
    const value = extractField(text, pattern);
    if (value) {
      // Convert to appropriate type
      let finalValue: any = value;
      if (pattern.type === 'currency') {
        finalValue = parseCurrency(value);
      } else if (pattern.type === 'date') {
        finalValue = value; // Keep as string for now
      }

      (data as any)[fieldKey] = finalValue;
      data.fields_found.push(fieldKey);
    } else if (pattern.required) {
      data.errors.push(`Campo obrigatório não encontrado: ${fieldKey}`);
    }
  }

  // Validate and calculate confidence
  validateAndCalculateConfidence(data);

  return data;
}

function extractField(text: string, pattern: FieldPattern): string | null {
  for (const regex of pattern.pattern) {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function parseCurrency(value: string): number {
  // Remove R$, spaces, and normalize decimal
  const normalized = value
    .replace(/r?\$?\s*/i, '')
    .replace(/\./g, '') // Remove thousand separator
    .replace(/,/g, '.'); // Convert comma to dot for parsing
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

function validateAndCalculateConfidence(data: HoleriteData): void {
  const weights: Record<string, number> = {
    // Critical fields
    competencia: 0.15,
    salario_bruto: 0.20,
    salario_liquido: 0.20,
    
    // Important
    cpf: 0.10,
    inss: 0.08,
    irrf: 0.08,
    fgts: 0.05,
    
    // Nice to have
    cnpj: 0.04,
    empresa: 0.04,
    nome: 0.03,
    data_pagamento: 0.03,
  };

  let totalWeight = 0;
  let foundWeight = 0;

  for (const [field, weight] of Object.entries(weights)) {
    totalWeight += weight;
    if (data.fields_found.includes(field)) {
      foundWeight += weight;
    }
  }

  // Validate mathematical consistency
  if (data.salario_bruto !== undefined && data.salario_liquido !== undefined) {
    const deductions = (data.inss || 0) + (data.irrf || 0);
    const expectedLiquido = data.salario_bruto - deductions;
    const difference = Math.abs(expectedLiquido - (data.salario_liquido || 0));
    const percentDiff = (difference / data.salario_bruto) * 100;

    if (percentDiff > 5) {
      data.errors.push(
        `Inconsistência matemática: Bruto ${data.salario_bruto} - Descontos ${deductions} ≠ Líquido ${data.salario_liquido}`
      );
    }
  }

  // Calculate final confidence
  data.confidence = Math.round((foundWeight / totalWeight) * 100);

  // Reduce confidence if there are errors
  if (data.errors.length > 0) {
    data.confidence = Math.max(0, data.confidence - 20);
  }
}

export function validateHoleriteData(data: HoleriteData): { valid: boolean; errors: string[] } {
  const errors: string[] = [...data.errors];

  if (!data.competencia) {
    errors.push('Competência é obrigatória');
  }

  if (!data.salario_bruto || data.salario_bruto === 0) {
    errors.push('Salário bruto é obrigatório');
  }

  if (!data.salario_liquido || data.salario_liquido === 0) {
    errors.push('Salário líquido é obrigatório');
  }

  if (data.salario_bruto && data.salario_liquido && data.salario_bruto < data.salario_liquido) {
    errors.push('Salário bruto não pode ser menor que o líquido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
