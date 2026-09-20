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

export interface AppData {
  salario: number;
  contas: Account[];
  categorias: Category[];
  historico: MonthlyHistory[];
  vexpenses: VehicleExpense[];
}

// ===== IRPF Types =====

export interface IRPFExercise {
  id: string;
  year: number;
  status: 'draft' | 'pending_review' | 'submitted' | 'closed';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface IRPFDocument {
  id: string;
  exercise_id: string;
  filename: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  document_type?: string;
  status: 'pending' | 'processing' | 'extracted' | 'error';
  extraction_progress: number;
  extracted_data?: string;
  confidence_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFIncome {
  id: string;
  exercise_id: string;
  document_id?: string;
  income_type: string;
  description?: string;
  amount: number;
  month?: number;
  source?: string;
  confidence_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFAsset {
  id: string;
  exercise_id: string;
  document_id?: string;
  asset_type: string;
  description?: string;
  value: number;
  location?: string;
  confidence_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFDependent {
  id: string;
  exercise_id: string;
  name: string;
  cpf?: string;
  relationship: string;
  birth_date?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFDeduction {
  id: string;
  exercise_id: string;
  document_id?: string;
  deduction_type: string;
  description?: string;
  amount: number;
  category?: string;
  confidence_score: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFAlert {
  id: string;
  exercise_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  related_id?: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface IRPFRule {
  id: string;
  year: number;
  rule_type: string;
  rule_name: string;
  rule_value?: string;
  description?: string;
  source_url?: string;
  source_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
