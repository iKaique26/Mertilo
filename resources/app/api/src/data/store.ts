import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppData, Category } from '../types.js';
import { createBackup } from '../utils/backup.js';
import { logger } from '../utils/logger.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.MERTILO_DATA_DIR
  ? path.resolve(process.env.MERTILO_DATA_DIR)
  : path.resolve(moduleDir, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const LEGACY_DATA_FILE = process.env.MERTILO_LEGACY_DATA_FILE;
const TEMP_DATA_FILE = `${DATA_FILE}.tmp`;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', nome: 'Moradia', cor: '#7C3AED', percentual: 0.3 },
  { id: '2', nome: 'Alimentação', cor: '#6366F1', percentual: 0.15 },
  { id: '3', nome: 'Transporte', cor: '#001F54', percentual: 0.1 },
  { id: '4', nome: 'Saúde', cor: '#10B981', percentual: 0.1 },
  { id: '5', nome: 'Educação', cor: '#F59E0B', percentual: 0.05 },
  { id: '6', nome: 'Compras', cor: '#F97316', percentual: 0.08 },
  { id: '7', nome: 'Assinaturas e serviços digitais', cor: '#EC4899', percentual: 0.06 },
  { id: '8', nome: 'Lazer e entretenimento', cor: '#8B5CF6', percentual: 0.04 },
  { id: '9', nome: 'Viagens', cor: '#14B8A6', percentual: 0.04 },
  { id: '10', nome: 'Impostos', cor: '#F43F5E', percentual: 0.04 },
  { id: '11', nome: 'Salário e outras receitas', cor: '#22C55E', percentual: 0.18 },
  { id: '12', nome: 'Investimentos e aplicações', cor: '#0EA5E9', percentual: 0.05 },
  { id: '13', nome: 'Não categorizado', cor: '#94A3B8', percentual: 0.05 },
];

const defaultData = (): AppData => ({
  salario: 0,
  contas: [],
  categorias: DEFAULT_CATEGORIES,
  historico: [],
  vexpenses: [],
  importHistory: [],
  importedTransactions: [],
});

function normalizeData(value: Partial<AppData>): AppData {
  const defaults = defaultData();
  return {
    salario: typeof value.salario === 'number' && Number.isFinite(value.salario) ? value.salario : defaults.salario,
    contas: Array.isArray(value.contas) ? value.contas : defaults.contas,
    categorias: Array.isArray(value.categorias) && value.categorias.length > 0 ? value.categorias : defaults.categorias,
    historico: Array.isArray(value.historico) ? value.historico : defaults.historico,
    vexpenses: Array.isArray(value.vexpenses) ? value.vexpenses : defaults.vexpenses,
    importHistory: Array.isArray(value.importHistory) ? value.importHistory : defaults.importHistory,
    importedTransactions: Array.isArray(value.importedTransactions) ? value.importedTransactions : defaults.importedTransactions,
  };
}

function ensureDataFile(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    if (LEGACY_DATA_FILE && fs.existsSync(LEGACY_DATA_FILE)) {
      fs.copyFileSync(LEGACY_DATA_FILE, DATA_FILE);
      return;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData(), null, 2), 'utf8');
  }
}

export function readData(): AppData {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return normalizeData(parsed);
  } catch (error) {
    logger.error('Não foi possível ler os dados financeiros:', error);
    const fallback = defaultData();
    try {
      fs.writeFileSync(TEMP_DATA_FILE, JSON.stringify(fallback, null, 2), 'utf8');
      fs.renameSync(TEMP_DATA_FILE, DATA_FILE);
    } catch (restoreError) {
      logger.error('Não foi possível restaurar o arquivo de dados:', restoreError);
    }
    return fallback;
  }
}

export function writeData(data: AppData): void {
  ensureDataFile();
  if (fs.existsSync(DATA_FILE)) {
    createBackup(DATA_FILE);
  }

  const normalized = normalizeData(data);
  const serialized = JSON.stringify(normalized, null, 2);
  fs.writeFileSync(TEMP_DATA_FILE, serialized, 'utf8');
  fs.renameSync(TEMP_DATA_FILE, DATA_FILE);
}
