/**
 * Migration: users, metas, investments
 */
export default `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT
  );

  -- Sessions table (simple session tokens for now)
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Goals / metas
  CREATE TABLE IF NOT EXISTS metas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Investments
  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT,
    instrument TEXT,
    amount REAL NOT NULL,
    current_value REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Verification codes for email confirmation
  CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Password resets
  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Add user_id to existing tables (non-destructive)
  ALTER TABLE accounts ADD COLUMN user_id TEXT;
  ALTER TABLE categories ADD COLUMN user_id TEXT;
  ALTER TABLE monthly_history ADD COLUMN user_id TEXT;
  ALTER TABLE salary_config ADD COLUMN user_id TEXT;
  ALTER TABLE vehicle_expenses ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_exercises ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_documents ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_income ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_assets ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_dependents ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_deductions ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_validations ADD COLUMN user_id TEXT;
  ALTER TABLE irpf_correction_history ADD COLUMN user_id TEXT;
`;
