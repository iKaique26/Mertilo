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
