import fs from 'fs';
import path from 'path';
import { processFile } from './dist/services/file-processor.js';

// Read test file
const testFilePath = 'c:\\Users\\kaiqu\\OneDrive\\Desktop\\test_holerite_01.txt';
const text = fs.readFileSync(testFilePath, 'utf-8');

// Create temporary copy as text/plain
const tmpFilePath = path.join(process.cwd(), 'test_holerite_tmp.txt');
fs.writeFileSync(tmpFilePath, text);

console.log('\n=== TESTE DO FILE-PROCESSOR ===\n');
console.log('Arquivo:', tmpFilePath);
console.log('MIME type: text/plain');
console.log('Tamanho:', text.length, 'bytes\n');

// Process
try {
  const result = await processFile(tmpFilePath, 'text/plain');

  console.log('=== RESULTADO ===');
  console.log(`Sucesso: ${result.success}`);
  console.log(`Tipo do documento: ${result.documentType}`);
  console.log(`Confiança: ${result.confidence}%`);
  console.log(`Campos encontrados: ${result.fields.length}`);
  console.log(`Erros: ${result.errors.length}`);
  console.log(`Avisos: ${result.warnings.length}\n`);

  if (result.holeriteData) {
    console.log('=== DADOS DO HOLERITE ===');
    console.log(`Competência: ${result.holeriteData.competencia}`);
    console.log(`CPF: ${result.holeriteData.cpf}`);
    console.log(`Empresa: ${result.holeriteData.empresa}`);
    console.log(`CNPJ: ${result.holeriteData.cnpj}`);
    console.log(`Salário Bruto: R$ ${result.holeriteData.salario_bruto}`);
    console.log(`INSS: R$ ${result.holeriteData.inss}`);
    console.log(`IRRF: R$ ${result.holeriteData.irrf}`);
    console.log(`FGTS: R$ ${result.holeriteData.fgts}`);
    console.log(`Salário Líquido: R$ ${result.holeriteData.salario_liquido}`);
    console.log(`Confiança: ${result.holeriteData.confidence}%`);
  }

  if (result.errors.length > 0) {
    console.log('\n=== ERROS ===');
    result.errors.forEach(e => console.log(`- ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n=== AVISOS ===');
    result.warnings.forEach(w => console.log(`- ${w}`));
  }

  console.log('\n=== CAMPOS EXTRAÍDOS ===');
  result.fields.slice(0, 10).forEach(f => {
    console.log(`${f.name}: ${f.value} (${Math.round(f.confidence)}%)`);
  });
  if (result.fields.length > 10) {
    console.log(`... e ${result.fields.length - 10} mais campos`);
  }

  console.log('\n=== RESUMO DO PROCESSAMENTO ===');
  console.log(JSON.stringify({
    success: result.success,
    documentType: result.documentType,
    confidence: result.confidence,
    fieldsCount: result.fields.length,
    errorsCount: result.errors.length,
    warningsCount: result.warnings.length,
    holeriteDataAvailable: !!result.holeriteData,
  }, null, 2));

} catch (error) {
  console.error('Erro ao processar:', error);
} finally {
  // Clean up
  if (fs.existsSync(tmpFilePath)) {
    fs.unlinkSync(tmpFilePath);
  }
}
