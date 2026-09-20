import Database from 'better-sqlite3';
const dbPath = process.argv[2] || 'data/mertilo.test.1788789370543.db';
const db = new Database(dbPath);
const rows = db.prepare("PRAGMA table_info('irpf_exercises')").all();
console.log('DB:', dbPath);
console.log(rows);
db.close();
