import { getDatabase } from '../../../database/db.js';
import type { IRPFRule } from '../../../types.js';

export const rulesRepository = {
  create(data: Omit<IRPFRule, 'id' | 'created_at' | 'updated_at'>): IRPFRule {
    const db = getDatabase();
    const id = `rule_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_rules 
      (id, year, rule_type, rule_name, rule_value, description, source_url, source_date, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.year,
      data.rule_type,
      data.rule_name,
      data.rule_value || null,
      data.description || null,
      data.source_url || null,
      data.source_date || null,
      data.is_active ? 1 : 0,
      now,
      now
    );

    return {
      id,
      year: data.year,
      rule_type: data.rule_type,
      rule_name: data.rule_name,
      rule_value: data.rule_value,
      description: data.description,
      source_url: data.source_url,
      source_date: data.source_date,
      is_active: data.is_active || true,
      created_at: now,
      updated_at: now,
    };
  },

  getByYear(year: number): IRPFRule[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM irpf_rules WHERE year = ? AND is_active = 1');
    return stmt.all(year) as IRPFRule[];
  },

  getByYearAndType(year: number, ruleType: string): IRPFRule[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM irpf_rules WHERE year = ? AND rule_type = ? AND is_active = 1');
    return stmt.all(year, ruleType) as IRPFRule[];
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM irpf_rules WHERE id = ?');
    stmt.run(id);
    return true;
  },
};
