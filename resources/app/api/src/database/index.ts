/**
 * Database Initialization
 * Inicializa banco de dados na startup
 */

import { getDatabase, closeDatabase } from './db.js';
import { runMigrations } from './migrations.js';
import { migrateJsonToSqlite } from './json-to-sqlite.js';
import { logger } from '../utils/logger.js';

/**
 * Inicializar database
 * Chamado na startup da aplicação
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('🔄 Inicializando database...');

    // Obter ou criar conexão
    const db = getDatabase();

    // Executar migrations
    runMigrations(db);

    // Migrar dados JSON se necessário
    migrateJsonToSqlite(db);

    logger.info('✅ Database inicializado com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao inicializar database:', error);
    throw error;
  }
}

/**
 * Fechar database na shutdown
 */
export async function shutdownDatabase(): Promise<void> {
  try {
    closeDatabase();
    logger.info('✅ Database desconectado');
  } catch (error) {
    logger.error('❌ Erro ao desconectar database:', error);
  }
}
