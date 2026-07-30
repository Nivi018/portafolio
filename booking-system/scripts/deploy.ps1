# ============================================
# Script de Deploy Automatizado a Vercel (Windows)
# ============================================

Write-Host "🚀 BookingSystem - Deploy Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json no encontrado" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto"
    exit 1
}

# Verificar que git está instalado
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Error: git no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git encontrado" -ForegroundColor Green

# Verificar/instalar Vercel CLI
$vercelInstalled = $null
try {
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
} catch {}

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI no está instalado" -ForegroundColor Yellow
    Write-Host "   Instalando..."
    npm install -g vercel
}

Write-Host "✅ Pre-requisitos verificados" -ForegroundColor Green
Write-Host ""

# Verificar cambios sin commitear
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Hay cambios sin commitear:" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $commit = Read-Host "¿Quieres hacer commit de estos cambios? (y/n)"
    if ($commit -eq "y") {
        $message = Read-Host "Mensaje del commit"
        git add .
        git commit -m $message
        Write-Host "✅ Cambios commiteados" -ForegroundColor Green
    } else {
        Write-Host "❌ Deploy cancelado" -ForegroundColor Red
        exit 1
    }
}

# Push a GitHub
Write-Host ""
Write-Host "📤 Subiendo cambios a GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer push" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cambios en GitHub" -ForegroundColor Green
Write-Host ""

# Deploy a Vercel
Write-Host "🚀 Desplegando a Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "¿Qué tipo de deploy quieres?"
Write-Host "1) Producción (main branch)"
Write-Host "2) Preview (genera URL temporal)"
$choice = Read-Host "Selecciona (1/2)"

if ($choice -eq "1") {
    vercel --prod
} else {
    vercel
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el deploy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡Deploy exitoso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Verifica la URL de tu app"
Write-Host "   2. Configura el webhook de Stripe"
Write-Host "   3. Ejecuta las migraciones en producción (si no lo has hecho)"
Write-Host "   4. Configura tu dominio personalizado (opcional)"
Write-Host ""
Write-Host "📖 Ver DEPLOY_GUIDE.md para más detalles"
