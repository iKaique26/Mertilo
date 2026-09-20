import fs from 'fs';
import http from 'http';

// Configuration
const API_URL = 'http://127.0.0.1:5000';
const EXERCISE_ID = 'exercise_1788733945344';
const TEST_FILE = 'c:\\Users\\kaiqu\\OneDrive\\Desktop\\test_holerite_01.txt';

// Read file
const fileContent = fs.readFileSync(TEST_FILE, 'utf-8');
const fileStats = fs.statSync(TEST_FILE);

// Encode to base64
const base64Content = Buffer.from(fileContent).toString('base64');
const dataUrl = `data:text/plain;base64,${base64Content}`;

// Prepare payload
const payload = {
  filename: 'holerite_test_01.txt',
  mime_type: 'text/plain',
  file_size: fileStats.size,
  file_content: dataUrl,
};

console.log('=== TESTE DE UPLOAD COM HOLERITE ===\n');
console.log('Arquivo:', TEST_FILE);
console.log('Tamanho:', fileStats.size, 'bytes');
console.log('Base64 length:', base64Content.length);
console.log('Exercise ID:', EXERCISE_ID);
console.log('Payload size:', JSON.stringify(payload).length, 'bytes\n');

// Make request
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: `/api/irpf/documents/${EXERCISE_ID}/upload`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(payload)),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);

    try {
      const parsed = JSON.parse(data);
      console.log('\n=== RESPONSE ===');
      console.log(JSON.stringify(parsed, null, 2));

      if (parsed.document) {
        console.log('\n✅ DOCUMENTO CRIADO');
        console.log('ID:', parsed.document.id);
        console.log('Tipo:', parsed.document.document_type);
      }

      if (parsed.extraction) {
        console.log('\n✅ EXTRAÇÃO COMPLETA');
        console.log('Documento:', parsed.extraction.documentType);
        console.log('Confiança:', parsed.extraction.confidence + '%');
        console.log('Campos encontrados:', parsed.extraction.fields.length);

        if (parsed.extraction.holeriteData) {
          const h = parsed.extraction.holeriteData;
          console.log('\nHOLERITE:');
          console.log('- Competência:', h.competencia);
          console.log('- CPF:', h.cpf);
          console.log('- Bruto: R$', h.salario_bruto);
          console.log('- Líquido: R$', h.salario_liquido);
          console.log('- Confiança:', h.confidence + '%');
        }
      }
    } catch (e) {
      console.log('Raw response:', data.substring(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.write(JSON.stringify(payload));
req.end();
