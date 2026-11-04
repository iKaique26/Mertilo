const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'resources', 'app', 'api', 'data');
const files = fs.readdirSync(dir).filter((f) => /^data-backup-.*\.json$/.test(f));
let total = 0;
let filesWithCorruption = 0;
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const arr = Array.isArray(raw.importedTransactions)
    ? raw.importedTransactions
    : Array.isArray(raw.transactions)
      ? raw.transactions
      : [];
  const bad = arr.filter((r) => {
    const v = Number(r && r.value);
    if (!Number.isFinite(v)) return false;
    const abs = Math.abs(v);
    return abs > 1000 && abs % 100 === 0;
  });
  if (bad.length) {
    filesWithCorruption++;
    total += bad.length;
    console.log(file, 'bad=', bad.length, 'sample=', JSON.stringify(bad.slice(0, 3).map((x) => ({ value: x.value, duplicateHash: x.duplicateHash }))));
  }
}
console.log('filesWithCorruption=', filesWithCorruption);
console.log('totalCorruptedRecords=', total);
