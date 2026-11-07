import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveEnvironmentFile() {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, '.env'),
    path.resolve(cwd, 'resources', 'app', 'api', '.env'),
    path.resolve(cwd, 'api', '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(cwd, '..', 'api', '.env'),
    path.resolve(apiDirectory, '.env'),
    path.resolve(apiDirectory, '..', '.env'),
    path.resolve(apiDirectory, '..', '..', '.env'),
  ];

  return [...new Set(candidates.filter(Boolean))].find((candidate) => fs.existsSync(candidate));
}

const envPath = resolveEnvironmentFile();
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const { default: app } = await import('./app.js');
const { initializeDatabase } = await import('./database/index.js');
const { getDatabase } = await import('./database/db.js');
const { logger } = await import('./utils/logger.js');
const { emailService } = await import('./services/email.service.js');

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await initializeDatabase();
    emailService.logConfigurationStatus();

    const db = getDatabase();
    app.set('db', db);

    app.listen(port, '0.0.0.0', () => {
      logger.info(`✅ Servidor rodando na porta ${port}`);
      logger.info(`📚 Documentação: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

start();
