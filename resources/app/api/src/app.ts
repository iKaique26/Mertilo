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
import authRouter from './routes/auth.js';
import { readData } from './data/store.js';
import { logger } from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = YAML.load(join(__dirname, '..', 'swagger.yaml'));
const app = express();
const allowedOrigins = new Set(['null', 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174', 'http://127.0.0.1:5175', 'http://localhost:5175', 'http://127.0.0.1:5176', 'http://localhost:5176']);
const configuredOrigins = (process.env.MERTILO_ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
for (const origin of configuredOrigins) allowedOrigins.add(origin);

app.use(cors({
  origin(origin, callback) {
    // Somente aceita origin explícita ou requisições sem Origin (health checks locais).
    // Em desktop local, a origem das telas embutidas costuma ser "null".
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: false,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});
app.get('/', (_req, res) => res.json({ status: 'API rodando', timestamp: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/api/financas', (_req, res) => res.json(readData()));
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
