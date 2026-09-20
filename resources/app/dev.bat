@echo off
REM Script para rodar Vite dev server + Electron simultaneamente com hot reload
REM Windows version

echo Starting Vite dev server + Electron...
echo.

REM Inicia Vite dev server em background
start "Mertilo Dev Server" cmd /k "npm run dev"

REM Aguarda 3 segundos para o Vite iniciar
timeout /t 3 /nobreak

REM Inicia Electron apontando para o dev server
set ELECTRON_START_URL=http://127.0.0.1:5173
npm start
