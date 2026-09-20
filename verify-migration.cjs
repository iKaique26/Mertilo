const Database = require('better-sqlite3');

const db = new Database('resources/app/api/data/mertilo.db');

console.log('\n=== VERIFICAÇÃO DE DADOS MIGRADOS ===\n');

const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get();
const accounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
const history = db.prepare('SELECT COUNT(*) as count FROM monthly_history').get();
const vexpenses = db.prepare('SELECT COUNT(*) as count FROM vehicle_expenses').get();
const salary = db.prepare('SELECT COUNT(*) as count FROM salary_config').get();

console.log(`📊 Categorias: ${categories.count}`);
console.log(`📊 Contas: ${accounts.count}`);
console.log(`📊 Histórico: ${history.count}`);
console.log(`📊 Despesas Veículo: ${vexpenses.count}`);
console.log(`📊 Salário Config: ${salary.count}`);

// Amostra de dados
console.log('\n=== AMOSTRA DE CATEGORIAS ===\n');
const catSample = db.prepare('SELECT * FROM categories LIMIT 2').all();
catSample.forEach(cat => console.log(`${cat.name}: ${cat.color}`));

console.log('\n=== AMOSTRA DE CONTAS ===\n');
const accSample = db.prepare('SELECT * FROM accounts LIMIT 2').all();
accSample.forEach(acc => console.log(`${acc.name}: R$ ${acc.valor}`));

console.log('\n✅ Verificação completa!\n');
db.close();
