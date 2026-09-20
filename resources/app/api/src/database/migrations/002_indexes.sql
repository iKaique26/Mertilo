/**
 * Indexes Migration
 * Adiciona índices para melhorar performance de consultas
 */

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
