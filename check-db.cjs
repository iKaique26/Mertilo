const Database = require('better-sqlite3');

const db = new Database('resources/app/api/data/mertilo.db');

// Listar todas as tabelas
console.log('\n=== TABELAS EXISTENTES ===\n');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log('✓', t.name));

// Verificar schema de cada tabela
console.log('\n=== SCHEMA DAS TABELAS ===\n');
for (const table of tables) {
  if (table.name === 'sqlite_sequence') continue;
  console.log(`\n📋 ${table.name}:`);
  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
  schema.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
}

db.close();
