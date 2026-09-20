# Frontend Source

Este diretório é destinado ao código fonte do frontend (React, Vue, Svelte, etc.).
Atualmente, o aplicativo está usando a versão compilada localizada em `../dist`.
Para desenvolver, coloque o código fonte aqui e configure um processo de build que
gere os arquivos em `../dist`.

Sugerimos usar um bundler como Vite, Webpack ou Create React App com a saída
configurada para `../dist`.

Exemplo de script de build (package.json):
  "build": "vite build --outDir ../dist"

Após quem alterar o fonte, execute o build e recarregue o Electron.
