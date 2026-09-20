/**
 * Migration Runner
 * Executa migrations versionadas
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migrations disponíveis
 * Key: nome da migration (para rastreamento)
 * Value: SQL a executar
 */
const migrations: Record<string, string> = {
  '001_initial_schema': `
    -- Tabela de categorias
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      percentage REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tabela de contas
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      valor REAL NOT NULL,
      category TEXT,
      is_fixed BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tabela de histórico mensal
    CREATE TABLE IF NOT EXISTS monthly_history (
      id TEXT PRIMARY KEY,
      mes TEXT NOT NULL,
      salary REAL NOT NULL,
      total_contas REAL DEFAULT 0,
      saldo_disponivel REAL DEFAULT 0,
      total_extras REAL DEFAULT 0,
      renda_total REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tabela de despesas de veículo
    CREATE TABLE IF NOT EXISTS vehicle_expenses (
      id TEXT PRIMARY KEY,
      preco_combustivel REAL NOT NULL,
      media_consumo REAL NOT NULL,
      km_percorrido REAL NOT NULL,
      tipo_trajeto TEXT NOT NULL,
      custo REAL NOT NULL,
      receita REAL NOT NULL,
      lucro REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tabela de salário (configuração)
    CREATE TABLE IF NOT EXISTS salary_config (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  '002_indexes': `
    -- Índices para accounts
    CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at DESC);

    -- Índices para categories
    CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at DESC);

    -- Índices para monthly_history
    CREATE INDEX IF NOT EXISTS idx_monthly_history_mes ON monthly_history(mes DESC);
    CREATE INDEX IF NOT EXISTS idx_monthly_history_created_at ON monthly_history(created_at DESC);

    -- Índices para vehicle_expenses
    CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_created_at ON vehicle_expenses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_tipo_trajeto ON vehicle_expenses(tipo_trajeto);
  `,

  '003_irpf_schema': `
    -- Tabela de exercícios fiscais
    CREATE TABLE IF NOT EXISTS irpf_exercises (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      progress INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(year)
    );

    -- Tabela de documentos
    CREATE TABLE IF NOT EXISTS irpf_documents (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      document_type TEXT,
      status TEXT DEFAULT 'pending',
      extraction_progress INTEGER DEFAULT 0,
      extracted_data TEXT,
      confidence_score INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id)
    );

    -- Tabela de rendimentos
    CREATE TABLE IF NOT EXISTS irpf_income (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      document_id TEXT,
      income_type TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      month INTEGER,
      source TEXT,
      confidence_score INTEGER DEFAULT 100,
      is_verified BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id),
      FOREIGN KEY(document_id) REFERENCES irpf_documents(id)
    );

    -- Tabela de bens e direitos
    CREATE TABLE IF NOT EXISTS irpf_assets (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      document_id TEXT,
      asset_type TEXT NOT NULL,
      description TEXT,
      value REAL NOT NULL,
      location TEXT,
      confidence_score INTEGER DEFAULT 100,
      is_verified BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id),
      FOREIGN KEY(document_id) REFERENCES irpf_documents(id)
    );

    -- Tabela de dependentes
    CREATE TABLE IF NOT EXISTS irpf_dependents (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cpf TEXT,
      relationship TEXT NOT NULL,
      birth_date TEXT,
      is_verified BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id)
    );

    -- Tabela de deduções
    CREATE TABLE IF NOT EXISTS irpf_deductions (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      document_id TEXT,
      deduction_type TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      category TEXT,
      confidence_score INTEGER DEFAULT 100,
      is_verified BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id),
      FOREIGN KEY(document_id) REFERENCES irpf_documents(id)
    );

    -- Tabela de alertas e pendências
    CREATE TABLE IF NOT EXISTS irpf_alerts (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      related_id TEXT,
      is_resolved BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id)
    );

    -- Tabela de regras fiscais (por exercício/ano)
    CREATE TABLE IF NOT EXISTS irpf_rules (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      rule_type TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      rule_value TEXT,
      description TEXT,
      source_url TEXT,
      source_date TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(year, rule_type, rule_name)
    );

    -- Tabela de ligação entre financeiro e fiscal
    CREATE TABLE IF NOT EXISTS irpf_financial_linkage (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      irpf_income_id TEXT,
      irpf_asset_id TEXT,
      irpf_deduction_id TEXT,
      financial_history_id TEXT,
      confirmed BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES irpf_exercises(id),
      FOREIGN KEY(irpf_income_id) REFERENCES irpf_income(id),
      FOREIGN KEY(irpf_asset_id) REFERENCES irpf_assets(id),
      FOREIGN KEY(irpf_deduction_id) REFERENCES irpf_deductions(id)
    );

    -- Índices para documentos
    CREATE INDEX IF NOT EXISTS idx_irpf_documents_exercise_id ON irpf_documents(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_documents_status ON irpf_documents(status);
    CREATE INDEX IF NOT EXISTS idx_irpf_documents_created_at ON irpf_documents(created_at DESC);

    -- Índices para rendimentos
    CREATE INDEX IF NOT EXISTS idx_irpf_income_exercise_id ON irpf_income(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_income_is_verified ON irpf_income(is_verified);
    CREATE INDEX IF NOT EXISTS idx_irpf_income_created_at ON irpf_income(created_at DESC);

    -- Índices para bens
    CREATE INDEX IF NOT EXISTS idx_irpf_assets_exercise_id ON irpf_assets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_assets_is_verified ON irpf_assets(is_verified);
    CREATE INDEX IF NOT EXISTS idx_irpf_assets_created_at ON irpf_assets(created_at DESC);

    -- Índices para deduções
    CREATE INDEX IF NOT EXISTS idx_irpf_deductions_exercise_id ON irpf_deductions(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_deductions_is_verified ON irpf_deductions(is_verified);
    CREATE INDEX IF NOT EXISTS idx_irpf_deductions_created_at ON irpf_deductions(created_at DESC);

    -- Índices para alertas
    CREATE INDEX IF NOT EXISTS idx_irpf_alerts_exercise_id ON irpf_alerts(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_alerts_severity ON irpf_alerts(severity);

    -- Índices para exercises e regras
    CREATE INDEX IF NOT EXISTS idx_irpf_exercises_year ON irpf_exercises(year);
    CREATE INDEX IF NOT EXISTS idx_irpf_rules_year ON irpf_rules(year);
    CREATE INDEX IF NOT EXISTS idx_irpf_rules_rule_type ON irpf_rules(rule_type);

    -- Índices para ligação financeira
    CREATE INDEX IF NOT EXISTS idx_irpf_financial_linkage_exercise_id ON irpf_financial_linkage(exercise_id);
  `,
  '004_irpf_review_center': `
    -- Corrections history
    CREATE TABLE IF NOT EXISTS irpf_correction_history (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      document_id TEXT,
      extracted_data_id TEXT,
      field_name TEXT,
      original_value TEXT,
      corrected_value TEXT,
      actor TEXT,
      reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_irpf_corrections_exercise_id ON irpf_correction_history(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_corrections_document_id ON irpf_correction_history(document_id);

    -- Persisted validation entries
    CREATE TABLE IF NOT EXISTS irpf_validations (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      validation_key TEXT NOT NULL,
      type TEXT,
      severity TEXT,
      title TEXT,
      description TEXT,
      status TEXT DEFAULT 'PENDING',
      source_document_id TEXT,
      related_document_id TEXT,
      related_entity TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      resolved_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_irpf_validations_unique_key ON irpf_validations(exercise_id, validation_key);
    CREATE INDEX IF NOT EXISTS idx_irpf_validations_exercise_id ON irpf_validations(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_irpf_validations_status ON irpf_validations(status);
  `,
  '010_users_meta_investments': `
   

    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
  `,
};

const migrationRequirements: Record<string, string[]> = {
  '010_users_meta_investments': ['users', 'user_sessions', 'verification_codes', 'password_resets', 'metas', 'investments'],
};

function tableExists(db: Database.Database, tableName: string): boolean {
  const row = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?").get(tableName) as any;
  return Boolean(row);
}

function ensureUserIdColumn(db: Database.Database, tableName: string): void {
  if (!tableExists(db, tableName)) return;
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
  if (columns.some((column) => column.name === 'user_id')) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN user_id TEXT`);
}

function ensureLegacyUserColumns(db: Database.Database): void {
  const tables = [
    'accounts',
    'categories',
    'monthly_history',
    'salary_config',
    'vehicle_expenses',
    'irpf_exercises',
    'irpf_documents',
    'irpf_income',
    'irpf_assets',
    'irpf_dependents',
    'irpf_deductions',
    'irpf_validations',
    'irpf_correction_history'
  ];

  for (const tableName of tables) {
    try {
      ensureUserIdColumn(db, tableName);
    } catch (error) {
      logger.warn(`Coluna user_id não foi adicionada em ${tableName}; tabela pode já estar em outro estado.`);
    }
  }
}

function requiresMigrationExecution(db: Database.Database, migrationName: string): boolean {
  const requiredTables = migrationRequirements[migrationName];
  if (!requiredTables) return false;
  return requiredTables.some((tableName) => !tableExists(db, tableName));
}

/**
 * Obter lista de migrations disponíveis (em ordem)
 */
function getAvailableMigrations(): string[] {
  return Object.keys(migrations).sort();
}

/**
 * Obter migrations já executadas
 */
function getExecutedMigrations(db: Database.Database): string[] {
  try {
    // Criar tabela schema_migrations se não existir
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = db.prepare('SELECT migration_name FROM schema_migrations ORDER BY applied_at').all();
    return result.map((r: any) => r.migration_name);
  } catch (error) {
    // Tabela não existe ainda
    return [];
  }
}

/**
 * Executar uma migration
 */
function executeMigration(db: Database.Database, migrationName: string): void {
  let sql = migrations[migrationName];
  // If migration slot is a tiny placeholder, attempt to load companion file
  if (migrationName === '010_users_meta_investments') {
    try {
      const p1 = path.join(__dirname, 'migrations_010_users_meta_investments.ts');
      const p2 = path.join(__dirname, '..', '..', 'src', 'database', 'migrations_010_users_meta_investments.ts');
      const p = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null;
      if (p) {
        const content = fs.readFileSync(p, 'utf-8');
        // file exports default string; naive extraction: find backtick block
        const match = content.match(/export default `(.*)`;/s);
        if (match) sql = match[1];
      }
    } catch (err) {
      logger.error('Erro carregando migration companion:', err);
    }
  }
  if (!sql) {
    throw new Error(`Migration não encontrada: ${migrationName}`);
  }

  try {
    // Remover comentários e linhas vazias
    let cleanSql = sql
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        // Ignorar linhas vazias e comentários
        return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');

    // Executar cada comando SQL separadamente
    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error) {
        logger.error(`❌ Erro ao executar statement em ${migrationName}:`, statement.substring(0, 100), error);
        throw error;
      }
    }

    // Registrar a migration como executada
    db.prepare('INSERT OR IGNORE INTO schema_migrations (migration_name) VALUES (?)').run(
      migrationName
    );

    logger.info(`✅ Migration executada: ${migrationName}`);
  } catch (error) {
    logger.error(`❌ Erro na migration ${migrationName}:`, error);
    throw error;
  }
}

/**
 * Executar todas as migrations pendentes
 */
export function runMigrations(db: Database.Database): void {
  try {
    logger.info('🔄 Iniciando migrations...');

    const available = getAvailableMigrations();
    const executed = getExecutedMigrations(db);
    const pending = available.filter((m) => {
      if (!executed.includes(m)) return true;
      return requiresMigrationExecution(db, m);
    });

    if (pending.length === 0) {
      ensureLegacyUserColumns(db);
      logger.info('✅ Banco de dados já está atualizado');
      return;
    }

    logger.info(`📋 ${pending.length} migration(s) pendente(s)`);

    for (const migration of pending) {
      executeMigration(db, migration);
    }

    ensureLegacyUserColumns(db);

    logger.info('✅ Todas as migrations executadas com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao executar migrations:', error);
    throw error;
  }
}
