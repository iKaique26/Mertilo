/**
 * Initial Schema Migration
 * Cria todas as tabelas necessárias para a aplicação
 */

-- Tabela de controle de migração
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
