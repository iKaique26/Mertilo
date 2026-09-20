import fs from 'fs';
import { readHolerite, validateHoleriteData } from './dist/services/holerite-reader.js';

// Read test file
const testFilePath = 'c:\\Users\\kaiqu\\OneDrive\\Desktop\\test_holerite_01.txt';
const text = fs.readFileSync(testFilePath, 'utf-8');

console.log('\n=== TESTE DO HOLERITE-READER ===\n');
console.log('Texto lido:', text.substring(0, 150) + '...\n');

// Process
const result = readHolerite(text);

console.log('Resultado:');
console.log(JSON.stringify(result, null, 2));

console.log('\n=== VALIDAÇÃO ===\n');
const validation = validateHoleriteData(result);
console.log('Válido:', validation.valid);
console.log('Erros:', validation.errors);

console.log('\n=== CAMPOS ENCONTRADOS ===');
console.log(result.fields_found);

console.log('\n=== RESUMO ===');
console.log(`Confiança: ${result.confidence}%`);
console.log(`Salário Bruto: R$ ${result.salario_bruto}`);
console.log(`Salário Líquido: R$ ${result.salario_liquido}`);
console.log(`INSS: R$ ${result.inss}`);
console.log(`IRRF: R$ ${result.irrf}`);
