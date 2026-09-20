/**
 * JSON to SQLite Migration
 * Migra dados de JSON para SQLite com validação
 */

import Database from 'better-sqlite3';
import { readData } from '../data/store.js';
import { logger } from '../utils/logger.js';
import type { AppData } from '../types.js';

/**
 * Interface para rastrear migração
 */
interface MigrationStats {
  categories: { before: number; after: number };
  accounts: { before: number; after: number };
  history: { before: number; after: number };
  vexpenses: { before: number; after: number };
  salary: { before: number; after: number };
}

function cryptoRandomId(...parts: any[]) {
  // lightweight deterministic id based on parts
  try {
    const s = parts.map((p) => String(p || '')).join('|');
    const hash = require('crypto').createHash('sha1').update(s).digest('hex');
    return hash.substring(0, 12);
  } catch (err) {
    return String(Date.now()).slice(-12);
  }
}

/**
 * Contar registros antes da migração
 */
function getJsonStats(data: AppData): Omit<MigrationStats, 'salary'> {
  return {
    categories: { before: data.categorias.length, after: 0 },
    accounts: { before: data.contas.length, after: 0 },
    history: { before: data.historico.length, after: 0 },
    vexpenses: { before: data.vexpenses.length, after: 0 },
  };
}

/**
 * Contar registros no banco
 */
function getDbStats(db: Database.Database): MigrationStats {
  const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as any;
  const accounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as any;
  const history = db.prepare('SELECT COUNT(*) as count FROM monthly_history').get() as any;
  const vexpenses = db.prepare('SELECT COUNT(*) as count FROM vehicle_expenses').get() as any;
  const salary = db.prepare('SELECT COUNT(*) as count FROM salary_config').get() as any;

  return {
    categories: { before: 0, after: categories.count },
    accounts: { before: 0, after: accounts.count },
    history: { before: 0, after: history.count },
    vexpenses: { before: 0, after: vexpenses.count },
    salary: { before: 0, after: salary.count },
  };
}

/**
 * Migrar dados de JSON para SQLite
 */
export function migrateJsonToSqlite(db: Database.Database): void {
  logger.info('🚀 Iniciando migração JSON → SQLite');

  try {
    // Ler dados JSON
    const jsonData = readData();
    const statsBefore = {
      ...getJsonStats(jsonData),
      salary: { before: jsonData.salario > 0 ? 1 : 0, after: 0 },
    };

    logger.info('📊 Dados no JSON:');
    logger.info(`  - Categorias: ${statsBefore.categories.before}`);
    logger.info(`  - Contas: ${statsBefore.accounts.before}`);
    logger.info(`  - Histórico: ${statsBefore.history.before}`);
    logger.info(`  - Despesas Veículo: ${statsBefore.vexpenses.before}`);
    logger.info(`  - Salário: ${statsBefore.salary.before > 0 ? 'sim' : 'não'}`);

    // Verificar se já há dados no banco
    const existingData = db.prepare('SELECT COUNT(*) as count FROM categories').get() as any;
    if (existingData.count > 0) {
      logger.warn('⚠️  Banco já possui dados. Abortando migração para não duplicar.');
      return;
    }

    // Começar transação
    const transaction = db.transaction(() => {
      // Migrar categorias
      const insertCategory = db.prepare(
        `INSERT INTO categories (id, name, color, percentage, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const cat of jsonData.categorias) {
        insertCategory.run(
          cat.id,
          cat.nome,
          cat.cor,
          cat.percentual,
          new Date().toISOString(),
          new Date().toISOString()
        );
      }

      // Migrar contas
      const insertAccount = db.prepare(
        `INSERT INTO accounts (id, name, valor, category, is_fixed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      for (const acc of jsonData.contas) {
        insertAccount.run(
          acc.id,
          acc.nome,
          acc.valor,
          acc.categoria,
          acc.isFixed ? 1 : 0,
          acc.data,
          new Date().toISOString()
        );
      }

      // Migrar histórico
      const insertHistory = db.prepare(
        `INSERT INTO monthly_history (id, mes, salary, total_contas, saldo_disponivel, total_extras, renda_total, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const hist of jsonData.historico) {
        insertHistory.run(
          hist.id,
          hist.mes,
          hist.salario,
          hist.totalContas,
          hist.saldoDisponivel,
          hist.totalExtras,
          hist.rendaTotal,
          hist.criadoEm,
          new Date().toISOString()
        );
      }

      // Migrar despesas de veículo
      const insertVExpense = db.prepare(
        `INSERT INTO vehicle_expenses (id, preco_combustivel, media_consumo, km_percorrido, tipo_trajeto, custo, receita, lucro, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const vexp of jsonData.vexpenses) {
        insertVExpense.run(
          vexp.id,
          vexp.precoCombustivel,
          vexp.mediaConsumo,
          vexp.kmPercorrido,
          vexp.tipoTrajeto,
          vexp.custo,
          vexp.receita,
          vexp.lucro,
          vexp.data,
          new Date().toISOString()
        );
      }

      // Migrar salário
      if (jsonData.salario > 0) {
        const insertSalary = db.prepare(
          `INSERT INTO salary_config (id, amount, updated_at) VALUES (?, ?, ?)`
        );
        insertSalary.run('salary', jsonData.salario, new Date().toISOString());
      }
    });

    // Executar transação
    transaction();

    // Validar migração
    const statsAfter = getDbStats(db);

    logger.info('✅ Dados migrados para SQLite:');
    logger.info(`  - Categorias: ${statsBefore.categories.before} → ${statsAfter.categories.after}`);
    logger.info(`  - Contas: ${statsBefore.accounts.before} → ${statsAfter.accounts.after}`);
    logger.info(`  - Histórico: ${statsBefore.history.before} → ${statsAfter.history.after}`);
    logger.info(
      `  - Despesas Veículo: ${statsBefore.vexpenses.before} → ${statsAfter.vexpenses.after}`
    );
    logger.info(`  - Salário: ${statsAfter.salary.after > 0 ? 'sim' : 'não'}`);

    // Verificar integridade
    const categoryMatch = statsBefore.categories.before === statsAfter.categories.after;
    const accountMatch = statsBefore.accounts.before === statsAfter.accounts.after;
    const historyMatch = statsBefore.history.before === statsAfter.history.after;
    const vexpenseMatch = statsBefore.vexpenses.before === statsAfter.vexpenses.after;

    if (categoryMatch && accountMatch && historyMatch && vexpenseMatch) {
      logger.info('✅ Validação de integridade: PASSED');
    } else {
      logger.error('❌ Validação de integridade: FALHA');
      logger.error('Categorias:', categoryMatch ? '✅' : '❌');
      logger.error('Contas:', accountMatch ? '✅' : '❌');
      logger.error('Histórico:', historyMatch ? '✅' : '❌');
      logger.error('Despesas Veículo:', vexpenseMatch ? '✅' : '❌');
      throw new Error('Migração falhou na validação de integridade');
    }

    logger.info('🎉 Migração JSON → SQLite concluída com sucesso!');
    // --- Migração segura de correções antigas (extracted_data._corrections) --> irpf_correction_history
    try {
      const docsWithCorrections = db.prepare("SELECT id, exercise_id, extracted_data FROM irpf_documents WHERE extracted_data IS NOT NULL AND extracted_data LIKE '%_corrections%'").all() as any[];
      if (docsWithCorrections && docsWithCorrections.length > 0) {
        logger.info(`🔁 Migrando correções embutidas de ${docsWithCorrections.length} documento(s)`);
        const insert = db.prepare(`INSERT OR IGNORE INTO irpf_correction_history (id, exercise_id, document_id, extracted_data_id, field_name, original_value, corrected_value, actor, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const row of docsWithCorrections) {
          try {
            const parsed = JSON.parse((row as any).extracted_data || '{}');
            const corr = parsed._corrections;
            if (Array.isArray(corr)) {
              for (const c of corr) {
                const createdAt = c.at || new Date().toISOString();
                const corrId = `corr_mig_${cryptoRandomId(row.id, c.field, createdAt)}`;
                // Avoid duplicates by checking similar existing record
                const exists = db.prepare('SELECT COUNT(*) as cnt FROM irpf_correction_history WHERE document_id = ? AND field_name = ? AND original_value = ? AND corrected_value = ? AND created_at = ?').get((row as any).id, c.field, c.original == null ? null : String(c.original), c.corrected == null ? null : String(c.corrected), createdAt) as any;
                if (exists && exists.cnt > 0) continue;
                insert.run(corrId, (row as any).exercise_id, (row as any).id, null, c.field, c.original == null ? null : String(c.original), c.corrected == null ? null : String(c.corrected), c.by || null, c.reason || null, createdAt);
              }
            }
          } catch (err) {
            logger.error('Erro ao migrar correções de documento', (row as any).id, err);
          }
        }
        logger.info('✅ Migração de correções concluída');
      }
    } catch (err) {
      logger.error('Erro durante migração de correções embutidas:', err);
    }
  } catch (error) {
    logger.error('❌ Erro durante migração:', error);
    throw error;
  }
}
