import { randomUUID } from 'node:crypto';
import { readUserData, updateUserData, withStorageLock, writeUserData } from '../data/store.js';
import { detectEncoding, detectHeaderRow, detectDateFormat, parseMonetary } from '../utils/csvDetection.js';
import { exercisesRepository } from '../modules/irpf/repositories/exercise.repository.js';
import { incomeRepository } from '../modules/irpf/repositories/income.repository.js';
import { getDatabase } from '../database/db.js';
import type { ImportCompensationRecord } from '../types.js';

export function sanitizeCsvFormula(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[\s\t\r\n]*[=+\-@|%]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function exportCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields
    .map((val) => {
      if (typeof val === 'number') {
        return Number.isFinite(val) ? String(val) : '';
      }
      const sanitized = sanitizeCsvFormula(val);
      if (sanitized.includes('"') || sanitized.includes(',') || sanitized.includes(';') || sanitized.includes('\n') || sanitized.includes('\r')) {
        return `"${sanitized.replace(/"/g, '""')}"`;
      }
      return sanitized;
    })
    .join(';');
}

class SqliteSyncError extends Error {
  causeError: unknown;
  createdIncomeIds: string[];
  exerciseIdsCreatedBySync: string[];

  constructor(causeError: unknown, createdIncomeIds: string[], exerciseIdsCreatedBySync: string[]) {
    super(causeError instanceof Error ? causeError.message : String(causeError));
    this.name = 'SqliteSyncError';
    this.causeError = causeError;
    this.createdIncomeIds = createdIncomeIds;
    this.exerciseIdsCreatedBySync = exerciseIdsCreatedBySync;
  }
}

export class IncompleteImportCompensationError extends Error {
  compensationIncomplete = true;
  batchId: string;
  pendingIncomeIds: string[];
  pendingExerciseIds: string[];

  constructor(message: string, batchId: string, pendingIncomeIds: string[], pendingExerciseIds: string[]) {
    super(message);
    this.name = 'IncompleteImportCompensationError';
    this.batchId = batchId;
    this.pendingIncomeIds = pendingIncomeIds;
    this.pendingExerciseIds = pendingExerciseIds;
  }
}

function syncIncomeToIrpf(records: ImportRecord[], userId: string): { createdIncomeIds: string[]; exerciseIdsCreatedBySync: string[] } {
  const createdIncomeIds: string[] = [];
  const exerciseIdsCreatedBySync: string[] = [];
  try {
    for (const record of records.filter((item) => item.type === 'entrada' && /sal[aá]rio|holerite|remunera[cç][aã]o/i.test(`${item.category} ${item.description}`))) {
      const year = Number(record.date.slice(0, 4));
      const month = Number(record.date.slice(5, 7));
      if (!year || !month) continue;
      let exercise = exercisesRepository.getByYear(year, userId);
      if (!exercise) {
        try {
          exercise = exercisesRepository.create(year, userId);
          exerciseIdsCreatedBySync.push(exercise.id);
        } catch (error: any) {
          if (error?.code !== 'SQLITE_CONSTRAINT_UNIQUE' && !String(error?.message || '').includes('UNIQUE constraint failed')) throw error;
          exercise = exercisesRepository.getByYear(year, userId) || exercisesRepository.getByYear(year);
          if (!exercise) throw error;
        }
      }
      const source = `financial-import:${record.id}`;
      if (incomeRepository.getAll(exercise.id, userId).some((income) => income.source === source)) continue;
      const created = incomeRepository.create(exercise.id, {
        exercise_id: exercise.id,
        income_type: 'salary',
        description: record.description,
        amount: Number(record.value) || 0,
        month,
        source,
        confidence_score: record.confidence || 100,
        is_verified: false,
      });
      createdIncomeIds.push(created.id);
    }
    return { createdIncomeIds, exerciseIdsCreatedBySync };
  } catch (syncError) {
    throw new SqliteSyncError(syncError, createdIncomeIds, exerciseIdsCreatedBySync);
  }
}

function compensateSqliteBatch(
  userId: string,
  incomeIds: string[],
  exerciseIds: string[]
): {
  deletedIncomeIds: string[];
  pendingIncomeIds: string[];
  deletedExerciseIds: string[];
  pendingExerciseIds: string[];
  errors: string[];
} {
  const deletedIncomeIds: string[] = [];
  const pendingIncomeIds: string[] = [];
  const deletedExerciseIds: string[] = [];
  const pendingExerciseIds: string[] = [];
  const errors: string[] = [];

  for (const incomeId of incomeIds) {
    try {
      incomeRepository.delete(incomeId, userId);
      deletedIncomeIds.push(incomeId);
    } catch (err) {
      pendingIncomeIds.push(incomeId);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  for (const exerciseId of exerciseIds) {
    try {
      const remainingIncomes = incomeRepository.getAll(exerciseId, userId);
      if (remainingIncomes.length === 0) {
        exercisesRepository.delete(exerciseId, userId);
        deletedExerciseIds.push(exerciseId);
      } else if (pendingIncomeIds.length > 0) {
        pendingExerciseIds.push(exerciseId);
      }
    } catch (err) {
      pendingExerciseIds.push(exerciseId);
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    deletedIncomeIds,
    pendingIncomeIds,
    deletedExerciseIds,
    pendingExerciseIds,
    errors,
  };
}

export type ImportDirection = 'entrada' | 'saída' | 'transferencia';

export interface ImportColumnMapping {
  date?: string;
  description?: string;
  value?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  transactionId?: string;
  account?: string;
}

export interface ImportRecord {
  userId: string;
  id: string;
  date: string;
  description: string;
  normalizedDescription: string;
  originalDescription: string;
  value: number;
  type: ImportDirection;
  category: string;
  subcategory: string;
  confidence: number;
  account?: string;
  source: string;
  status: 'importado' | 'revisao';
  duplicateHash?: string;
  potentialDuplicate?: boolean;
  manualReview?: boolean;
  line: number;
  importSource: string;
  importedAt: string;
}

export interface CsvImportPreview {
  headers: string[];
  suggestedMapping: ImportColumnMapping;
  summary: {
    rows: number;
    entries: number;
    exits: number;
    invalid: number;
    duplicates: number;
    toReview: number;
    willImport: number;
  };
  records: ImportRecord[];
  errors: Array<{ line: number; message: string }>
}

const DEFAULT_CATEGORIES = [
  { category: 'Alimentação', subcategory: 'Supermercado', keywords: ['mercado', 'extra', 'carrefour', 'atacadao', 'hiper', 'supermercado', 'safra', 'pao de acucar', 'assai', 'super'] },
  { category: 'Alimentação', subcategory: 'Restaurantes', keywords: ['restaurante', 'burger', 'pizza', 'cafeteria', 'padaria', 'churrasco', 'marmita'] },
  { category: 'Alimentação', subcategory: 'Delivery', keywords: ['ifood', 'delivery', 'rappi', 'uber eats', 'food'] },
  { category: 'Transporte', subcategory: 'Aplicativos', keywords: ['uber', '99', 'cabify', 'aplicativo transporte', 'taxi'] },
  { category: 'Transporte', subcategory: 'Combustível', keywords: ['posto', 'petrobras', 'shell', 'combustivel', 'gasolina', 'diesel'] },
  { category: 'Transporte', subcategory: 'Transporte Público', keywords: ['bilhete unico', 'metro', 'onibus', 'transporte publico'] },
  { category: 'Moradia', subcategory: 'Aluguel', keywords: ['aluguel', 'locacao', 'condominio'] },
  { category: 'Moradia', subcategory: 'Internet', keywords: ['netflix', 'claro', 'tim', 'fibra', 'internet', 'wifi', 'vivo'] },
  { category: 'Moradia', subcategory: 'Água', keywords: ['agua', 'copasa', 'saa'] },
  { category: 'Moradia', subcategory: 'Energia', keywords: ['energia', 'eletricit', 'light', 'eneel'] },
  { category: 'Saúde', subcategory: 'Farmácia', keywords: ['farmacia', 'droga', 'drogaria', 'remedio'] },
  { category: 'Saúde', subcategory: 'Consultas', keywords: ['consulta', 'clinica', 'dentista', 'medico', 'hospital'] },
  { category: 'Compras', subcategory: 'Roupas', keywords: ['roupa', 'loja de roupas', 'zara', 'renner', 'h&m', 'moda'] },
  { category: 'Compras', subcategory: 'Eletrônicos', keywords: ['eletronico', 'smartphone', 'notebook', 'teclado', 'apple', 'casas bahia', 'magalu', 'microcenter'] },
  { category: 'Compras', subcategory: 'Casa', keywords: ['moveis', 'casa', 'utensilios', 'decor', 'loja de casa'] },
  { category: 'Assinaturas e serviços digitais', subcategory: 'Streaming', keywords: ['netflix', 'spotify', 'prime video', 'disney', 'youtube premium', 'streaming', 'playstation plus'] },
  { category: 'Lazer e entretenimento', subcategory: 'Entretenimento', keywords: ['cinema', 'ingresso', 'teatro', 'show', 'bar', 'pub'] },
  { category: 'Educação', subcategory: 'Cursos', keywords: ['curso', 'escola', 'faculdade', 'udemy', 'alura', 'mentoria'] },
  { category: 'Viagens', subcategory: 'Transporte', keywords: ['passagem', 'hotel', 'viagem', 'booking', 'airbnb'] },
  { category: 'Tarifas bancárias e juros', subcategory: 'Bancos', keywords: ['tarifa', 'juros', 'banco', 'financiamento', 'cdb', 'multa'] },
  { category: 'Impostos', subcategory: 'Tributos', keywords: ['imposto', 'iptu', 'ipva', 'taxa', 'tributo'] },
  { category: 'Transferências entre contas próprias', subcategory: 'Transferência', keywords: ['transferencia', 'ted', 'doc', 'pix', 'transfer'] },
  { category: 'Pagamentos de cartão de crédito', subcategory: 'Fatura', keywords: ['cartao', 'fatura', 'pagamento cartao'] },
  { category: 'Salário e outras receitas', subcategory: 'Salário', keywords: ['salario', 'folha', 'remuneracao', 'pagamento'] },
  { category: 'Investimentos e aplicações', subcategory: 'Investimentos', keywords: ['investimento', 'aplicacao', 'cdb', 'tesouro', 'acoes', 'fii'] },
];

function normalizeHeader(label: string): string {
  return (label || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDescription(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickNonEmptyValue(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return '';
}

function parseMoney(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

  const value = String(raw).trim();
  if (!value) return null;

  const negative = value.startsWith('-')
    || /\((.*)\)/.test(value)
    || value.toLowerCase().includes('debito')
    || value.toLowerCase().includes('débito')
    || value.toLowerCase().includes('saida')
    || value.toLowerCase().includes('saída');

  const compact = value
    .replace(/[\sR$]/gi, '')
    .replace(/[^0-9,.-]/g, '')
    .trim();

  if (!compact || compact === '-' || compact === '.' || compact === ',') return null;

  const signless = compact.replace(/^[-+]/, '').replace(/[()]/g, '');
  const hasComma = signless.includes(',');
  const hasDot = signless.includes('.');

  let normalized = signless;

  if (hasComma && hasDot) {
    const lastComma = signless.lastIndexOf(',');
    const lastDot = signless.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = signless.replace(new RegExp(`\\${thousandSeparator}`, 'g'), '').replace(decimalSeparator, '.');
  } else if (hasComma) {
    const parts = signless.split(',');
    const lastSegment = parts[parts.length - 1] || '';
    if (lastSegment.length <= 2) {
      normalized = parts.slice(0, -1).join('') + '.' + lastSegment;
    } else {
      normalized = parts.join('');
    }
  } else if (hasDot) {
    const parts = signless.split('.');
    const lastSegment = parts[parts.length - 1] || '';
    if (lastSegment.length <= 2) {
      normalized = parts.join('.');
    } else {
      normalized = parts.join('');
    }
  }

  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  return negative ? -Math.abs(number) : number;
}

function parseDate(value: string): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const candidates = [
    'DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm', 'DD/MM/YY', 'YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ss', 'YYYY/MM/DD',
    'DD-MM-YYYY', 'DD.MM.YYYY', 'MM/DD/YYYY', 'MM-DD-YYYY', 'DD/MM'
  ];
  const normalized = raw.replace(/\s+/g, ' ').trim();

  for (const format of candidates) {
    if (format === 'DD/MM/YYYY' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
      const [d, m, y] = normalized.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'DD/MM/YYYY HH:mm' && /^\d{1,2}\/\d{1,2}\/\d{4}\s\d{1,2}:\d{2}$/.test(normalized)) {
      const [datePart, timePart] = normalized.split(' ');
      const [d, m, y] = datePart.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${timePart}`;
    }
    if (format === 'DD/MM/YY' && /^\d{1,2}\/\d{1,2}\/\d{2}$/.test(normalized)) {
      const [d, m, y] = normalized.split('/');
      return `20${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'YYYY-MM-DD' && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
    if (format === 'YYYY-MM-DDTHH:mm:ss' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
      return normalized;
    }
    if (format === 'YYYY/MM/DD' && /^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) {
      const [y, m, d] = normalized.split('/');
      return `${y}-${m}-${d}`;
    }
    if (format === 'DD-MM-YYYY' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(normalized)) {
      const [d, m, y] = normalized.split('-');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'DD.MM.YYYY' && /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(normalized)) {
      const [d, m, y] = normalized.split('.');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'MM/DD/YYYY' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
      const [m, d, y] = normalized.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'MM-DD-YYYY' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(normalized)) {
      const [m, d, y] = normalized.split('-');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (format === 'DD/MM' && /^\d{1,2}\/\d{1,2}$/.test(normalized)) {
      const [d, m] = normalized.split('/');
      return `${new Date().getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  const iso = new Date(normalized.replace(' ', 'T'));
  if (!Number.isNaN(iso.getTime())) {
    return iso.toISOString().slice(0, 10);
  }

  return null;
}

function detectDelimiter(content: string): string {
  const sample = content.split(/\r?\n/).slice(0, 20).join('\n');
  const delimiters = [',', ';', '\t'];
  let winner = ';';
  let maxScore = 0;

  for (const delimiter of delimiters) {
    const score = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (score > maxScore) {
      maxScore = score;
      winner = delimiter;
    }
  }

  return winner;
}

interface CsvRow { row: string[]; line: number; }

function parseCsvRows(content: string, delimiter: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let buffer = '';
  let inQuotes = false;
  let currentLine = 1;
  let rowStartLine = 1;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        buffer += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(buffer);
      buffer = '';
      continue;
    }

    const isLF = char === '\n';
    const isCRLF = char === '\r' && next === '\n';
    const isCR = char === '\r' && next !== '\n';

    if (isLF || isCRLF || isCR) {
      if (isCRLF) i += 1;
      currentLine += 1;
      if (!inQuotes) {
        row.push(buffer);
        if (row.some((value) => value.trim() !== '')) rows.push({ row, line: rowStartLine });
        row = [];
        buffer = '';
        rowStartLine = currentLine;
        continue;
      }
      buffer += char;
      if (isCRLF) buffer += '\n';
      continue;
    }

    buffer += char;
  }

  if (buffer.length > 0 || row.length > 0) {
    row.push(buffer);
    if (row.some((value) => value.trim() !== '')) rows.push({ row, line: rowStartLine });
  }

  return rows;
}

function buildSuggestedMapping(headers: string[]): ImportColumnMapping {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));

  const map: ImportColumnMapping = {};
  const findHeader = (candidates: string[]) => headers[normalizedHeaders.findIndex((header) => candidates.includes(header))] ?? undefined;

  const dateField = findHeader(['data', 'date', 'lancamento', 'data transacao', 'data ocorrencia', 'dt pagamento', 'dt pgto']);
  const descriptionField = findHeader(['descricao', 'descricao lancamento', 'historico', 'descricao movimento', 'movimento', 'detalhe', 'description', 'details', 'nome', 'transacao']);
  const valueField = findHeader(['valor', 'valor bruto', 'valor final', 'amount', 'valor movimentacao', 'montante', 'total']);
  const debitField = findHeader(['debito', 'débito', 'valor debito', 'debit', 'saidas', 'despesa', 'saida']);
  const creditField = findHeader(['credito', 'crédito', 'valor credito', 'credit', 'entradas', 'receita', 'entrada']);
  const balanceField = findHeader(['saldo', 'saldo final', 'balance']);
  const accountField = findHeader(['conta', 'account', 'banco', 'instituicao', 'cartao']);
  const transactionIdField = findHeader(['id', 'identificador', 'transacao id', 'transaction id', 'codigo', 'numero documento']);

  if (dateField) map.date = dateField;
  if (descriptionField) map.description = descriptionField;
  if (valueField) map.value = valueField;
  if (debitField) map.debit = debitField;
  if (creditField) map.credit = creditField;
  if (balanceField) map.balance = balanceField;
  if (accountField) map.account = accountField;
  if (transactionIdField) map.transactionId = transactionIdField;

  return map;
}

function resolveColumnValue(row: Record<string, string>, columnName?: string): string | undefined {
  if (!columnName) return undefined;
  const matchKey = Object.keys(row).find((key) => normalizeHeader(key) === normalizeHeader(columnName));
  if (!matchKey) return undefined;
  return row[matchKey];
}

function classifyTransaction(description: string, amount: number): { category: string; subcategory: string; confidence: number; status: 'importado' | 'revisao' } {
  const text = normalizeDescription(description);
  let best: { category: string; subcategory: string; confidence: number; status: 'importado' | 'revisao' } = {
    category: 'Não categorizado',
    subcategory: 'Outros',
    confidence: 0.18,
    status: 'revisao',
  };

  for (const rule of DEFAULT_CATEGORIES) {
    const matched = rule.keywords.some((keyword) => text.includes(normalizeDescription(keyword)));
    if (matched) {
      const score = Math.min(0.92, 0.46 + rule.keywords.length * 0.02);
      if (score > best.confidence) {
        best = { category: rule.category, subcategory: rule.subcategory, confidence: score, status: score >= 0.55 ? 'importado' : 'revisao' };
      }
    }
  }

  if (amount > 0 && !text.includes('salario') && !text.includes('remuneracao') && !text.includes('pix') && !text.includes('transferencia')) {
    if (best.category === 'Não categorizado') {
      return { category: 'Outros', subcategory: 'Outros', confidence: 0.2, status: 'revisao' };
    }
  }

  return best;
}

function buildDuplicateHash(record: { date: string; description: string; value: number; account?: string }): string {
  return `${(record.account || 'global')}::${record.date}::${Math.abs(record.value).toFixed(2)}::${normalizeDescription(record.description)}`;
}

function buildDuplicateMatchKey(record: { date: string; description: string; value: number; account?: string }): string {
  return `${record.date}::${Math.abs(record.value).toFixed(2)}::${normalizeDescription(record.description)}`;
}

function requireUserId(userId: string | undefined): string {
  if (!userId || !userId.trim()) throw new Error('Contexto de usuário obrigatório.');
  return userId;
}

function getExistingImportedTransactions(userId: string): any[] {
  return readUserData(userId).importedTransactions || [];
}

export function parseCsvPreview(rawCsv: string, options: { userId?: string; fileName?: string; mapping?: Partial<ImportColumnMapping>; existingRecords?: any[] } = {}): CsvImportPreview {
  const userId = requireUserId(options.userId);
  const rawText = String(rawCsv || '');
  if (!rawText.trim()) {
    return {
      headers: [],
      suggestedMapping: {},
      summary: { rows: 0, entries: 0, exits: 0, invalid: 0, duplicates: 0, toReview: 0, willImport: 0 },
      records: [],
      errors: [{ line: 1, message: 'Arquivo CSV vazio.' }],
    };
  }
  const text = rawText.replace(/^\uFEFF/, '').trimEnd();

  const delimiter = detectDelimiter(text);
  const rows = parseCsvRows(text, delimiter);
  const headerIdx = detectHeaderRow(rows.map((r) => r.row));
  if (headerIdx === -1 || rows.length < headerIdx + 2) {
    return {
      headers: [],
      suggestedMapping: {},
      summary: { rows: 0, entries: 0, exits: 0, invalid: 0, duplicates: 0, toReview: 0, willImport: 0 },
      records: [],
      errors: [{ line: 1, message: 'CSV sem cabeçalho ou sem linhas válidas.' }],
    };
  }
  const rawHeaders = rows[headerIdx].row.map((header) => header.trim());
  const headers = rawHeaders.filter((_, index) => index < rawHeaders.length);
  const suggestedMapping = { ...buildSuggestedMapping(headers), ...(options.mapping || {}) };
  const allRecords: ImportRecord[] = [];
  const errors: Array<{ line: number; message: string }> = [];
  const existing = options.existingRecords || getExistingImportedTransactions(userId);

  const seenHashes = new Map<string, number>();
  for (const existingItem of existing) {
    const hash = existingItem.duplicateHash || buildDuplicateHash({ date: existingItem.date, description: existingItem.description, value: existingItem.value, account: existingItem.account });
    const matchKey = buildDuplicateMatchKey({ date: existingItem.date, description: existingItem.description, value: existingItem.value, account: existingItem.account });
    seenHashes.set(hash, (seenHashes.get(hash) || 0) + 1);
    seenHashes.set(matchKey, (seenHashes.get(matchKey) || 0) + 1);
  }

  for (let i = headerIdx + 1; i < rows.length; i += 1) {
    const { row, line: physicalLine } = rows[i];
    const recordMap: Record<string, string> = {};
    for (let col = 0; col < headers.length; col += 1) {
      recordMap[headers[col]] = row[col] ?? '';
    }

    const dateText = resolveColumnValue(recordMap, suggestedMapping.date) ?? '';
    const descriptionText = resolveColumnValue(recordMap, suggestedMapping.description) ?? '';
    const rawValueText = resolveColumnValue(recordMap, suggestedMapping.value) ?? '';
    const debitText = resolveColumnValue(recordMap, suggestedMapping.debit) ?? '';
    const creditText = resolveColumnValue(recordMap, suggestedMapping.credit) ?? '';
    const valueText = pickNonEmptyValue(rawValueText, debitText, creditText);
    const parsedDate = parseDate(dateText);
    const value = parseMoney(valueText);
    const normalizedDescription = descriptionText || 'Movimentação sem descrição';

    if (!parsedDate || !normalizedDescription || value === null) {
      errors.push({ line: physicalLine, message: 'Linha inválida: data, descrição ou valor não puderam ser identificados.' });
      continue;
    }

    const hasDebit = !!(debitText || '').trim();
    const hasCredit = !!(creditText || '').trim();

    const numericValue = (() => {
      if (value !== null && hasDebit && !hasCredit) return Math.abs(value) * -1;
      if (value !== null && hasCredit && !hasDebit) return Math.abs(value);
      return value;
    })();

    const type: ImportDirection = numericValue >= 0 ? 'entrada' : 'saída';
    const classification = classifyTransaction(normalizedDescription, numericValue);
    const hash = buildDuplicateHash({ date: parsedDate, description: normalizedDescription, value: numericValue, account: suggestedMapping.account ? (resolveColumnValue(recordMap, suggestedMapping.account) ?? '') : undefined });
    const matchKey = buildDuplicateMatchKey({ date: parsedDate, description: normalizedDescription, value: numericValue, account: suggestedMapping.account ? (resolveColumnValue(recordMap, suggestedMapping.account) ?? '') : undefined });
    const duplicateCount = seenHashes.get(hash) || seenHashes.get(matchKey) || 0;
    const potentialDuplicate = duplicateCount > 0;
    if (potentialDuplicate) {
      seenHashes.set(hash, duplicateCount + 1);
      seenHashes.set(matchKey, duplicateCount + 1);
    }

    const record: ImportRecord = {
      userId,
      id: `${Date.now()}-${i}`,
      date: parsedDate,
      description: normalizedDescription,
      normalizedDescription: normalizeDescription(normalizedDescription),
      originalDescription: normalizedDescription,
      value: Number(numericValue.toFixed(2)),
      type,
      category: classification.category,
      subcategory: classification.subcategory,
      confidence: classification.confidence,
      account: resolveColumnValue(recordMap, suggestedMapping.account) || undefined,
      source: options.fileName || 'CSV importado',
      status: classification.status,
      duplicateHash: hash,
      potentialDuplicate,
      manualReview: classification.status === 'revisao' || potentialDuplicate,
      line: physicalLine,
      importSource: 'csv_import',
      importedAt: new Date().toISOString(),
    };

    allRecords.push(record);
  }

  const summary = {
    rows: rows.length - 1,
    entries: allRecords.filter((record) => record.type === 'entrada').length,
    exits: allRecords.filter((record) => record.type === 'saída').length,
    invalid: errors.length,
    duplicates: allRecords.filter((record) => record.potentialDuplicate).length,
    toReview: allRecords.filter((record) => record.manualReview).length,
    willImport: allRecords.filter((record) => !record.potentialDuplicate && !record.manualReview).length,
  };

  return {
    headers,
    suggestedMapping,
    summary,
    records: allRecords,
    errors,
  };
}

function ensureCategory(data: any, categoryName: string, userId: string): void {
  const name = (categoryName || '').trim();
  if (!name) return;

  const existing = (data.categorias || []).find((category: any) =>
    (category?.nome || '').toLowerCase() === name.toLowerCase() &&
    (!category?.userId || category.userId === userId)
  );

  if (existing) return;

  const palette = ['#7C3AED', '#6366F1', '#10B981', '#F59E0B', '#F97316', '#EC4899', '#14B8A6', '#0EA5E9'];
  data.categorias = [
    ...(data.categorias || []),
    {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      nome: name,
      cor: palette[(data.categorias || []).length % palette.length],
      percentual: 0.05,
    },
  ];
}

function getMonthKey(date: string): string | null {
  if (!date) return null;

  const normalized = String(date).trim();
  const parsed = new Date(normalized.includes('T') ? normalized : `${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

export function rebuildImportedMonthHistory(data: any, userId?: string): void {
  const ownerId = requireUserId(userId);
  const history = Array.isArray(data.historico) ? data.historico : [];
  const existingHistory = history.filter((entry: any) =>
    !String(entry?.id || '').startsWith('monthly-') || entry.userId !== ownerId
  );
  const monthMap = new Map<string, any>();

  for (const record of Array.isArray(data.importedTransactions) ? data.importedTransactions : []) {
    if (record?.userId !== ownerId) continue;
    const monthKey = getMonthKey(record.date);
    if (!monthKey) continue;

    const current = monthMap.get(monthKey) || {
      id: `monthly-${ownerId}-${monthKey}`,
      userId: ownerId,
      mes: monthKey,
      salario: 0,
      totalContas: 0,
      saldoDisponivel: 0,
      distribuicao: [],
      totalExtras: 0,
      rendaTotal: 0,
      extras: [],
      criadoEm: new Date().toISOString(),
    };

    const expenseDelta = record.type === 'saída' ? Math.abs(Number(record.value) || 0) : 0;
    const incomeDelta = record.type === 'entrada' ? Math.abs(Number(record.value) || 0) : 0;

    current.totalContas = Number((Number(current.totalContas || 0) + expenseDelta).toFixed(2));
    current.rendaTotal = Number((Number(current.rendaTotal || 0) + incomeDelta).toFixed(2));
    current.saldoDisponivel = Number((current.rendaTotal - current.totalContas).toFixed(2));
    monthMap.set(monthKey, current);
  }

  data.historico = [...existingHistory, ...Array.from(monthMap.values()).sort((a, b) => a.mes.localeCompare(b.mes))];
}

export function deleteImportedTransaction(userId: string | undefined, transactionId: string): { ok: boolean; removed: boolean; transactionId?: string; reason?: string } {
  const ownerId = requireUserId(userId);
  return updateUserData<{ ok: boolean; removed: boolean; transactionId?: string; reason?: string }>(ownerId, (data) => {
    const currentTransactions = Array.isArray(data.importedTransactions) ? data.importedTransactions : [];
    const target = currentTransactions.find((record: any) => record.id === transactionId && record.userId === ownerId);

    if (!target) {
      return { data, result: { ok: false, removed: false, reason: 'Transação não encontrada' } };
    }

    data.importedTransactions = currentTransactions.filter((record: any) => !(record.id === transactionId && record.userId === ownerId));
    data.importHistory = Array.isArray(data.importHistory) ? data.importHistory.map((batch: any) => {
      const nextTransactions = Array.isArray(batch.transactions) ? batch.transactions.filter((record: any) => record.id !== transactionId) : [];
      const summary = batch.summary || { total: 0, imported: 0, duplicates: 0, invalid: 0, toReview: 0 };
      return {
        ...batch,
        summary: {
          ...summary,
          total: Math.max(0, nextTransactions.length),
          imported: nextTransactions.filter((record: any) => !record.potentialDuplicate && !record.manualReview).length,
          duplicates: nextTransactions.filter((record: any) => record.potentialDuplicate).length,
          toReview: nextTransactions.filter((record: any) => record.manualReview).length,
        },
        transactions: nextTransactions,
      };
    }) : [];

    rebuildImportedMonthHistory(data, ownerId);
    return { data, result: { ok: true, removed: true, transactionId } };
  });
}

export function getPendingImportCompensations(userId: string | undefined): ImportCompensationRecord[] {
  const ownerId = requireUserId(userId);
  const data = readUserData(ownerId);
  return (Array.isArray(data.pendingCompensations) ? data.pendingCompensations : []).filter(
    (entry) => entry.userId === ownerId
  );
}

export interface CompensationRecoveryResult {
  ok: boolean;
  recoveredBatches: string[];
  failedBatches: Array<{
    batchId: string;
    pendingIncomeIds: string[];
    pendingExerciseIds: string[];
    errors: string[];
  }>;
  remaining: number;
}

export function recoverPendingImportCompensations(userId: string | undefined, batchId?: string): CompensationRecoveryResult {
  const ownerId = requireUserId(userId);
  const initialData = readUserData(ownerId);
  const targets = (Array.isArray(initialData.pendingCompensations) ? initialData.pendingCompensations : []).filter(
    (entry) => entry.userId === ownerId && (!batchId || entry.batchId === batchId)
  );

  if (targets.length === 0) {
    const remainingAll = (Array.isArray(initialData.pendingCompensations) ? initialData.pendingCompensations : []).length;
    return { ok: true, recoveredBatches: [], failedBatches: [], remaining: remainingAll };
  }

  const recoveredBatches: string[] = [];
  const failedBatches: CompensationRecoveryResult['failedBatches'] = [];

  for (const target of targets) {
    const result = compensateSqliteBatch(ownerId, target.pendingIncomeIds, target.pendingExerciseIds);
    const stillPending = result.pendingIncomeIds.length > 0 || result.pendingExerciseIds.length > 0;
    const now = new Date().toISOString();

    updateUserData(ownerId, (latest) => {
      const currentPending = Array.isArray(latest.pendingCompensations) ? latest.pendingCompensations : [];
      if (!stillPending) {
        const txIdSet = new Set(target.transactionIds);
        latest.importHistory = (Array.isArray(latest.importHistory) ? latest.importHistory : []).filter(
          (batch: any) => batch.id !== target.batchId
        );
        latest.importedTransactions = (Array.isArray(latest.importedTransactions) ? latest.importedTransactions : []).filter(
          (tx: any) => !(txIdSet.has(tx.id) && tx.userId === ownerId)
        );
        latest.pendingCompensations = currentPending.filter((entry) => entry.batchId !== target.batchId);
        rebuildImportedMonthHistory(latest, ownerId);
      } else {
        latest.pendingCompensations = currentPending.map((entry) =>
          entry.batchId === target.batchId
            ? {
                ...entry,
                pendingIncomeIds: result.pendingIncomeIds,
                pendingExerciseIds: result.pendingExerciseIds,
                attempts: entry.attempts + 1,
                lastError: result.errors.join('; ') || entry.lastError,
                updatedAt: now,
              }
            : entry
        );
      }
      return { data: latest, result: true };
    });

    if (!stillPending) {
      recoveredBatches.push(target.batchId);
    } else {
      failedBatches.push({
        batchId: target.batchId,
        pendingIncomeIds: result.pendingIncomeIds,
        pendingExerciseIds: result.pendingExerciseIds,
        errors: result.errors,
      });
    }
  }

  const remaining = getPendingImportCompensations(ownerId).length;
  return {
    ok: failedBatches.length === 0,
    recoveredBatches,
    failedBatches,
    remaining,
  };
}

export function undoCsvImport(userId: string | undefined, importId: string): { ok: boolean; revertedCount: number; importId?: string; reason?: string } {
  const ownerId = requireUserId(userId);
  const pendingForBatch = getPendingImportCompensations(ownerId).find((entry) => entry.batchId === importId);
  if (pendingForBatch) {
    const recovery = recoverPendingImportCompensations(ownerId, importId);
    if (!recovery.ok) {
      return {
        ok: false,
        revertedCount: 0,
        importId,
        reason: 'Compensação SQLite pendente não pôde ser concluída.',
      };
    }
    return { ok: true, revertedCount: pendingForBatch.transactionIds.length, importId };
  }

  return updateUserData<{ ok: boolean; revertedCount: number; importId?: string; reason?: string }>(ownerId, (data) => {
    const currentImports = Array.isArray(data.importHistory) ? data.importHistory : [];
    const batch = currentImports.find((entry: any) => entry.id === importId && entry.userId === ownerId);

    if (!batch) {
      return { data, result: { ok: false, revertedCount: 0, reason: 'Importação não encontrada' } };
    }

    const removedIds = new Set((Array.isArray(batch.transactions) ? batch.transactions : []).map((record: any) => record.id));
    data.importHistory = currentImports.filter((entry: any) => !(entry.id === importId && entry.userId === ownerId));
    data.importedTransactions = Array.isArray(data.importedTransactions) ? data.importedTransactions.filter((record: any) => !(removedIds.has(record.id) && record.userId === ownerId)) : [];

    rebuildImportedMonthHistory(data, ownerId);
    return { data, result: { ok: true, revertedCount: removedIds.size, importId } };
  });
}

export function confirmCsvImport(payload: { userId?: string; records: ImportRecord[]; fileName?: string }): { ok: boolean; importedCount: number; historyId: string; summary: { total: number; imported: number; duplicates: number; invalid: number; toReview: number }; } {
  const ownerId = requireUserId(payload.userId);
  const records = Array.isArray(payload.records) ? payload.records : [];
  const validRecords = records.filter((record) => !record.potentialDuplicate && !record.manualReview && !!record.date && Number.isFinite(record.value));

  const ownerRecords = validRecords.map((record) => ({ ...record, userId: ownerId }));
  const importBatchId = `import-${Date.now()}-${randomUUID().slice(0, 6)}`;
  const importBatch = {
    userId: ownerId,
    id: importBatchId,
    fileName: payload.fileName || 'importacao.csv',
    importedAt: new Date().toISOString(),
    summary: {
      total: records.length,
      imported: ownerRecords.length,
      duplicates: records.filter((record) => record.potentialDuplicate).length,
      invalid: 0,
      toReview: records.filter((record) => record.manualReview).length,
    },
    transactions: ownerRecords,
  };

  const newTransactions = ownerRecords.map((record) => ({
    ...record,
    userId: ownerId,
    value: Number(record.value.toFixed(2)),
    duplicateHash: record.duplicateHash || buildDuplicateHash(record as any),
  }));
  const newTransactionIds = new Set(newTransactions.map((tx) => tx.id));

  // 1. Gravação protegida com lock transacional no JSON
  updateUserData(ownerId, (data) => {
    for (const record of validRecords) {
      ensureCategory(data, record.category, ownerId);
    }
    const existingImports = Array.isArray(data.importHistory) ? data.importHistory : [];
    const existingTransactions = Array.isArray(data.importedTransactions) ? data.importedTransactions : [];

    data.importHistory = [importBatch, ...existingImports];
    data.importedTransactions = [...existingTransactions, ...newTransactions];
    rebuildImportedMonthHistory(data, ownerId);
    return { data, result: true };
  });

  // 2. Sincronização SQLite com compensação cirúrgica e registro de estado caso falhe parcialmente
  let createdIncomeIds: string[] = [];
  let createdExerciseIds: string[] = [];
  try {
    const syncResult = syncIncomeToIrpf(ownerRecords, ownerId);
    createdIncomeIds = syncResult.createdIncomeIds;
    createdExerciseIds = syncResult.exerciseIdsCreatedBySync;
  } catch (error) {
    if (error instanceof SqliteSyncError) {
      createdIncomeIds = error.createdIncomeIds;
      createdExerciseIds = error.exerciseIdsCreatedBySync;
    }

    const compensation = compensateSqliteBatch(ownerId, createdIncomeIds, createdExerciseIds);
    const hasPendingCompensation = compensation.pendingIncomeIds.length > 0 || compensation.pendingExerciseIds.length > 0;
    const rootCause = error instanceof SqliteSyncError ? error.causeError : error;

    if (!hasPendingCompensation) {
      updateUserData(ownerId, (data) => {
        data.importHistory = (Array.isArray(data.importHistory) ? data.importHistory : []).filter((batch: any) => batch.id !== importBatchId);
        data.importedTransactions = (Array.isArray(data.importedTransactions) ? data.importedTransactions : []).filter((tx: any) => !newTransactionIds.has(tx.id));
        if (Array.isArray(data.pendingCompensations)) {
          data.pendingCompensations = data.pendingCompensations.filter((entry) => entry.batchId !== importBatchId);
        }
        rebuildImportedMonthHistory(data, ownerId);
        return { data, result: true };
      });
      throw rootCause;
    }

    const now = new Date().toISOString();
    const rootMessage = rootCause instanceof Error ? rootCause.message : String(rootCause);
    const errorDetail = compensation.errors.join('; ') || rootMessage;

    updateUserData(ownerId, (data) => {
      const existingImports = Array.isArray(data.importHistory) ? data.importHistory : [];
      data.importHistory = existingImports.map((batch: any) =>
        batch.id === importBatchId ? { ...batch, compensationStatus: 'incomplete' } : batch
      );
      data.importedTransactions = (Array.isArray(data.importedTransactions) ? data.importedTransactions : []).filter(
        (tx: any) => !newTransactionIds.has(tx.id)
      );
      const existingPending = Array.isArray(data.pendingCompensations) ? data.pendingCompensations : [];
      data.pendingCompensations = [
        ...existingPending.filter((entry) => entry.batchId !== importBatchId),
        {
          batchId: importBatchId,
          userId: ownerId,
          status: 'compensation_incomplete',
          pendingIncomeIds: compensation.pendingIncomeIds,
          pendingExerciseIds: compensation.pendingExerciseIds,
          transactionIds: Array.from(newTransactionIds),
          attempts: 1,
          lastError: errorDetail,
          createdAt: now,
          updatedAt: now,
        },
      ];
      rebuildImportedMonthHistory(data, ownerId);
      return { data, result: true };
    });

    throw new IncompleteImportCompensationError(
      `${rootMessage} [compensação SQLite incompleta: lote ${importBatchId}; ${errorDetail}]`,
      importBatchId,
      compensation.pendingIncomeIds,
      compensation.pendingExerciseIds
    );
  }

  return {
    ok: true,
    importedCount: validRecords.length,
    historyId: importBatch.id,
    summary: importBatch.summary,
  };
}
