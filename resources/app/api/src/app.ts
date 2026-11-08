import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import accountsRouter from './modules/accounts.js';
import categoriesRouter from './modules/categories.js';
import historyRouter from './modules/history.js';
import salaryRouter from './modules/salary.js';
import vexpensesRouter from './modules/vexpenses.js';
import irpfRouter from './modules/irpf.js';
import financialImportRouter from './modules/financial-import.js';
import authRouter from './routes/auth.js';
import { logger } from './utils/logger.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { globalRateLimiter, authRateLimiter, loginRateLimiter, registerRateLimiter, passwordResetRateLimiter, resendVerificationRateLimiter, uploadRateLimiter } from './middleware/rateLimiter.js';
import { accountService } from './services/account.service.js';
import { categoryService } from './services/category.service.js';
import { historyService } from './services/history.service.js';
import { salaryService } from './services/salary.service.js';
import { vehicleExpenseService } from './services/vehicle-expense.service.js';
import { emailService } from './services/email.service.js';
import { readUserData } from './data/store.js';
function buildFinancialSummary(data: any, contas: any[], salario: number) {
  const transactions = Array.isArray(data.importedTransactions) ? data.importedTransactions : [];
  const importedIncome = transactions.filter((item: any) => item.type === 'entrada').reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0);
  const importedExpenses = transactions.filter((item: any) => item.type === 'saída').reduce((sum: number, item: any) => sum + Math.abs(Number(item.value) || 0), 0);
  const accountBalance = contas.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
  const byCategory = new Map<string, number>();
  for (const item of transactions) {
    if (item.type !== 'saída') continue;
    const name = item.category || 'Não categorizado';
    byCategory.set(name, (byCategory.get(name) || 0) + Math.abs(Number(item.value) || 0));
  }
  const categories = Array.from(byCategory, ([nome, gasto], index) => ({ id: `imported-${index}-${nome}`, nome, cor: '#6366F1', percentual: 0, gasto }));
  const recentActivity = [...transactions.map((item: any) => ({ id: item.id, type: 'transaction', date: item.date || item.importedAt, description: item.description, value: item.value, category: item.category })), ...((data.importHistory || []).map((item: any) => ({ id: item.id, type: 'import', date: item.importedAt, description: item.fileName, value: item.summary?.imported || 0 })))]
    .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date))).slice(0, 10);
  return { summary: { saldoTotal: accountBalance + importedIncome - importedExpenses, receitaTotal: salario + importedIncome, despesasImportadas: importedExpenses, gastosPorCategoria: categories, atividadeRecente: recentActivity } };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = YAML.load(join(__dirname, '..', 'swagger.yaml'));
const app = express();
// Render supplies one trusted proxy hop; local requests use socket IP directly.
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
const allowedOrigins = new Set(['null', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174', 'http://127.0.0.1:5175', 'http://localhost:5175', 'http://127.0.0.1:5176', 'http://localhost:5176']);
const configuredOrigins = [
  process.env.FRONTEND_URL ?? '',
  process.env.MERTILO_ALLOWED_ORIGIN ?? '',
]
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);
for (const origin of configuredOrigins) allowedOrigins.add(origin);
for (const origin of ['https://www.mertiloo.com.br', 'https://mertiloo.com.br', 'https://mertiloo-api.onrender.com']) {
  allowedOrigins.add(origin);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});
app.use(globalRateLimiter);
app.get('/', (_req, res) => res.json({ status: 'API rodando', timestamp: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/api/health/email', async (_req, res) => {
  const result = await emailService.diagnose();
  res.status(result.ok ? 200 : 503).json(result);
});
app.get('/api/financas', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Invalid session' });
    const data = readUserData(userId);
    if (!Array.isArray(data.importHistory) || !Array.isArray(data.importedTransactions) || !Array.isArray(data.categorias) || !Array.isArray(data.historico)) {
      return res.status(500).json({ error: 'Dados financeiros inválidos' });
    }
    const [contas, categorias, historico, salario, vexpenses] = await Promise.all([
      accountService.getAll(userId),
      categoryService.getAll(userId),
      historyService.getAll(userId),
      salaryService.get(userId),
      vehicleExpenseService.getAll(userId),
    ]);
    const importHistory = data.importHistory.filter((entry: any) => entry?.userId === userId);
    const importedTransactions = data.importedTransactions.filter((entry: any) => entry?.userId === userId);
    const summary = buildFinancialSummary({ ...data, importHistory, importedTransactions }, contas, salario);
    res.json({
      salario,
      contas,
      categorias: [...categorias, ...summary.summary.gastosPorCategoria],
      historico,
      vexpenses,
      importHistory,
      importedTransactions,
      summary: summary.summary,
    });
  } catch (error) {
    next(error);
  }
});
app.use('/api/financas/importacao', financialImportRouter);
app.use('/api/financas/salario', salaryRouter);
app.use('/api/financas/contas', accountsRouter);
app.use('/api/financas/historico', historyRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/vexpenses/historico', vexpensesRouter);
app.use('/api/irpf', irpfRouter);
app.use('/api/auth', authRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Erro interno:', error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});
export default app;
