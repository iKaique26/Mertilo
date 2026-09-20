import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import app from './app.js';
import { initializeDatabase } from './database/index.js';
import { getDatabase } from './database/db.js';
import { logger } from './utils/logger.js';
import { emailService } from './services/email.service.js';

const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];


for (const candidate of candidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const port = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await initializeDatabase();
    emailService.logConfigurationStatus();

    const db = getDatabase();
    app.set('db', db);

    app.listen(port, '127.0.0.1', () => {
      logger.info(`✅ Servidor rodando em http://127.0.0.1:${port}`);
      logger.info(`📚 Documentação: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

start();
