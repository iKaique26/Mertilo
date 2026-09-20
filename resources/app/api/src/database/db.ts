/**
 * Database Connection
 * Centraliza conexão SQLite com configurações apropriadas
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { logger } from '../utils/logger.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Obter caminho do database
 * Em produção (Electron packaged): usar userData (via env var)
 * Em desenvolvimento: usar pasta local
 */
export function getDatabasePath(): string {
  if (process.env.MERTILO_DB_PATH) {
    return process.env.MERTILO_DB_PATH;
  }

  const dataDir = process.env.MERTILO_DATA_DIR || path.resolve(moduleDir, '../../data');
  const dbPath = path.join(dataDir, 'mertilo.db');
  return dbPath;
}

/**
 * Instância única de conexão
 */
let dbInstance: Database.Database | null = null;

/**
 * Obter instância de database
 */
export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  
  // Garantir que o diretório existe
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  try {
    dbInstance = new Database(dbPath);
    
    // Habilitar foreign keys e configurações de segurança
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('journal_mode = WAL'); // Write-Ahead Logging para melhor performance
    dbInstance.pragma('synchronous = NORMAL'); // Balance entre segurança e performance
    
    logger.info(`Database conectado: ${dbPath}`);
    return dbInstance;
  } catch (error) {
    logger.error('Erro ao conectar ao database:', error);
    throw error;
  }
}

/**
 * Fechar database
 */
export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      logger.info('Database desconectado');
    } catch (error) {
      logger.error('Erro ao desconectar database:', error);
    }
  }
}

/**
 * Executar função dentro de uma transação
 */
export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDatabase();
  try {
    db.exec('BEGIN TRANSACTION');
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    logger.error('Erro na transação:', error);
    throw error;
  }
}

/**
 * Backup do database
 */
export function backupDatabase(): string {
  const db = getDatabase();
  const dbPath = getDatabasePath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dbPath}.backup.${timestamp}`;

  try {
    // Usar pragma backup para fazer backup consistente
    const backup = new Database(backupPath);
    db.exec(`VACUUM INTO '${backupPath}'`);
    backup.close();
    logger.info(`Backup criado: ${backupPath}`);
    return backupPath;
  } catch (error) {
    logger.error('Erro ao criar backup:', error);
    throw error;
  }
}
