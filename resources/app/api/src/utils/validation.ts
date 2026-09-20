import { TripType } from '../types.js';

export function validateCategoryPayload(value: { nome?: unknown; cor?: unknown; percentual?: unknown }): boolean {
  if (typeof value.nome !== 'string' || !value.nome.trim()) return false;
  if (typeof value.cor !== 'string' || !value.cor.trim()) return false;
  if (typeof value.percentual !== 'number' || !Number.isFinite(value.percentual) || value.percentual < 0 || value.percentual > 1) {
    return false;
  }
  return true;
}

export function validateCategorySet(categories: Array<{ percentual?: unknown }>): boolean {
  if (!Array.isArray(categories) || categories.length === 0) return false;
  const total = categories.reduce((sum, category) => {
    const percent = typeof category.percentual === 'number' && Number.isFinite(category.percentual) ? category.percentual : 0;
    return sum + percent;
  }, 0);
  return total <= 1 + 1e-9;
}

export function validateVehicleExpense(value: Partial<{ 
  precoCombustivel: number;
  mediaConsumo: number;
  kmPercorrido: number;
  tipoTrajeto: TripType;
  custo: number;
  receita: number;
  lucro: number;
}>): boolean {
  const tripTypes: TripType[] = ['escritorio', 'cliente'];
  if (typeof value.precoCombustivel !== 'number' || !Number.isFinite(value.precoCombustivel) || value.precoCombustivel < 0) return false;
  if (typeof value.mediaConsumo !== 'number' || !Number.isFinite(value.mediaConsumo) || value.mediaConsumo < 0) return false;
  if (typeof value.kmPercorrido !== 'number' || !Number.isFinite(value.kmPercorrido) || value.kmPercorrido < 0) return false;
  if (typeof value.tipoTrajeto !== 'string' || !tripTypes.includes(value.tipoTrajeto as TripType)) return false;
  if (typeof value.custo !== 'number' || !Number.isFinite(value.custo) || value.custo < 0) return false;
  if (typeof value.receita !== 'number' || !Number.isFinite(value.receita) || value.receita < 0) return false;
  if (typeof value.lucro !== 'number' || !Number.isFinite(value.lucro)) return false;
  return Math.abs(value.lucro - (value.receita - value.custo)) <= 1e-6;
}

export function validateHistorySummary(value: Partial<{ 
  mes: string;
  salario: number;
  totalContas: number;
  saldoDisponivel: number;
  distribuicao: unknown[];
  totalExtras: number;
  rendaTotal: number;
  extras: unknown[];
}>): boolean {
  if (typeof value.mes !== 'string' || !value.mes.trim()) return false;
  if (typeof value.salario !== 'number' || !Number.isFinite(value.salario) || value.salario < 0) return false;
  if (typeof value.totalContas !== 'number' || !Number.isFinite(value.totalContas) || value.totalContas < 0) return false;
  if (typeof value.saldoDisponivel !== 'number' || !Number.isFinite(value.saldoDisponivel) || value.saldoDisponivel < 0) return false;
  if (typeof value.totalExtras !== 'number' || !Number.isFinite(value.totalExtras) || value.totalExtras < 0) return false;
  if (typeof value.rendaTotal !== 'number' || !Number.isFinite(value.rendaTotal) || value.rendaTotal < 0) return false;
  if (!Array.isArray(value.distribuicao) || !Array.isArray(value.extras)) return false;

  if (value.rendaTotal < value.salario) return false;
  if (value.saldoDisponivel > value.rendaTotal) return false;
  if (value.totalContas > value.rendaTotal) return false;

  return true;
}
