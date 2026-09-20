import app from './app.js';

const port = Number(process.env.PORT) || 5000;

app.listen(port, '127.0.0.1', () => {
  console.log(`Servidor rodando em http://127.0.0.1:${port}`);
  console.log(`Documentação: http://localhost:${port}/api-docs`);
});
