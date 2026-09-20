import Database from 'better-sqlite3';
const dbPath = process.argv[2];
if (!dbPath) {
  console.error('Usage: node add_column.js <dbPath>');
  process.exit(1);
}
const db = new Database(dbPath);
try {
  db.exec("ALTER TABLE irpf_exercises ADD COLUMN user_id TEXT;");
  console.log('ALTER OK');
} catch (e) {
  console.error('ERR', e.message || e);
} finally {
  db.close();
}
