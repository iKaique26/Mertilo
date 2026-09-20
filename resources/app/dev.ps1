# Script PowerShell para rodar Vite dev server + Electron com hot reload
# Use: .\dev.ps1

Write-Host "🚀 Starting Mertilo Development Environment..." -ForegroundColor Green
Write-Host ""

# Verificar se npm está disponível
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Limpar dist anterior para evitar cache
Write-Host "🧹 Cleaning old build cache..." -ForegroundColor Yellow
Remove-Item -Path "../dist" -Recurse -Force -ErrorAction SilentlyContinue

# Iniciar Vite dev server em background
Write-Host "📦 Starting Vite dev server on http://127.0.0.1:5173..." -ForegroundColor Cyan
$viteProcess = Start-Process npm -ArgumentList "run", "dev" -NoNewWindow -PassThru

# Aguardar o Vite iniciar completamente (3 segundos é suficiente)
Write-Host "⏳ Waiting for dev server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar Electron apontando para o dev server
Write-Host "🎯 Starting Electron with hot reload..." -ForegroundColor Cyan
$env:ELECTRON_START_URL = "http://127.0.0.1:5173"

try {
    npm start
} finally {
    # Encerrar Vite quando Electron fechar
    Write-Host "🛑 Stopping dev server..." -ForegroundColor Yellow
    Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
}
