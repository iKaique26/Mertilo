/**
 * Tipos compartilhados do Frontend
 * Sincronizados com backend/types.ts
 */

export type TripType = 'escritorio' | 'cliente';

export interface Category {
  id: string;
  nome: string;
  cor: string;
  percentual: number;
}

export interface Account {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  isFixed: boolean;
  data: string;
}

export interface MonthlyHistory {
  id: string;
  mes: string;
  salario: number;
  totalContas: number;
  saldoDisponivel: number;
  distribuicao: unknown[];
  totalExtras: number;
  rendaTotal: number;
  extras: unknown[];
  criadoEm: string;
}

export interface VehicleExpense {
  id: string;
  data: string;
  precoCombustivel: number;
  mediaConsumo: number;
  kmPercorrido: number;
  tipoTrajeto: TripType;
  custo: number;
  receita: number;
  lucro: number;
}

export interface ImportedFinancialTransaction {
  id: string;
  date: string;
  description: string;
  normalizedDescription: string;
  originalDescription: string;
  value: number;
  type: 'entrada' | 'saída' | 'transferencia';
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

export interface FinancialImportHistoryEntry {
  id: string;
  fileName: string;
  importedAt: string;
  summary: {
    total: number;
    imported: number;
    duplicates: number;
    invalid: number;
    toReview: number;
  };
  transactions: ImportedFinancialTransaction[];
}

export interface AppData {
  salario: number;
  contas: Account[];
  categorias: Category[];
  historico: MonthlyHistory[];
  vexpenses: VehicleExpense[];
  importHistory: FinancialImportHistoryEntry[];
  importedTransactions: ImportedFinancialTransaction[];
}

/**
 * Estado do Financial Context
 */
export interface FinancialState {
  // Dados
  salario: number;
  accounts: Account[];
  categories: Category[];
  history: MonthlyHistory[];
  vehicleExpenses: VehicleExpense[];
  importHistory: FinancialImportHistoryEntry[];
  importedTransactions: ImportedFinancialTransaction[];

  // Estados de loading/erro
  loading: boolean;
  error: string | null;

  // Estados de UI (como filtros)
  selectedCategory: string | null;
}

/**
 * Ações do Financial Context Reducer
 */
export type FinancialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'SET_SALARY'; payload: number }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null };
