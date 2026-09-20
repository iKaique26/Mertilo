import Joi from 'joi';

export const categorySchema = Joi.object({
  nome: Joi.string().trim().min(1).required(),
  cor: Joi.string().trim().min(1).required(),
  percentual: Joi.number().min(0).max(1).required(),
});

export const accountSchema = Joi.object({
  nome: Joi.string().trim().min(1).required(),
  valor: Joi.number().min(0).required(),
  categoria: Joi.string().trim().min(1).default('Outros'),
  isFixed: Joi.boolean().default(true),
});

export const historySchema = Joi.object({
  mes: Joi.string().trim().min(1).required(),
  salario: Joi.number().min(0).required(),
  totalContas: Joi.number().min(0).required(),
  saldoDisponivel: Joi.number().required(),
  distribuicao: Joi.array().items(Joi.any()).required(),
  totalExtras: Joi.number().min(0).required(),
  rendaTotal: Joi.number().min(0).required(),
  extras: Joi.array().items(Joi.any()).required(),
});

export const vehicleExpenseSchema = Joi.object({
  precoCombustivel: Joi.number().min(0).required(),
  mediaConsumo: Joi.number().min(0).required(),
  kmPercorrido: Joi.number().min(0).required(),
  tipoTrajeto: Joi.string().valid('escritorio', 'cliente').required(),
  custo: Joi.number().min(0).required(),
  receita: Joi.number().min(0).required(),
  lucro: Joi.number().required(),
});
