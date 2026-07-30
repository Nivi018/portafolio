param(
    [string]$SupabaseHost = "db.bmrqlujvkkmtxjvuqrph.supabase.co",
    [int]$SupabasePort = 5432
)

$ErrorActionPreference = "Stop"

# Verificar que cloudflared existe
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "ERROR: cloudflared no esta instalado" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel para Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Host: $SupabaseHost" -ForegroundColor Yellow
Write-Host "Port: $SupabasePort" -ForegroundColor Yellow
Write-Host ""
Write-Host "Iniciando tunel... (esto puede tardar 10-15 segundos)" -ForegroundColor Green
Write-Host ""

# Iniciar cloudflared en segundo plano y capturar salida
$logFile = "C:\Windows\Temp\cloudflared-tunnel.log"
$process = Start-Process -FilePath "cloudflared" `
    -ArgumentList "tunnel --url tcp://${SupabaseHost}:${SupabasePort}" `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError "$logFile.err" `
    -NoNewWindow `
    -PassThru

Write-Host "PID del proceso: $($process.Id)" -ForegroundColor Gray
Write-Host "Log: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Esperando a que el tunel este listo..." -ForegroundColor Yellow

# Esperar y leer el log
$tunnelUrl = $null
$maxWait = 30
$waited = 0

while ($waited -lt $maxWait -and -not $tunnelUrl) {
    Start-Sleep -Seconds 2
    $waited += 2

    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        # Buscar la URL del tunnel (formato: https://xxx.trycloudflare.com)
        $match = [regex]::Match($content, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($match.Success) {
            $tunnelUrl = $match.Value
            break
        }
    }
}

if ($tunnelUrl) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  TUNEL CREADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL del tunnel: $tunnelUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ahora actualiza tu .env con:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DATABASE_URL=postgresql://postgres:98741236bussines@localhost:5432/postgres" -ForegroundColor White
    Write-Host "  (cloudflared mapea el tunnel a localhost:5432)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "O usa la URL directa del tunnel:" -ForegroundColor Yellow
    Write-Host "DATABASE_URL=postgresql://postgres:98741236bussines@$($tunnelUrl -replace 'https://', ''):443/postgres" -ForegroundColor White
    Write-Host ""
    Write-Host "El proceso cloudflared sigue corriendo en segundo plano." -ForegroundColor Green
    Write-Host "Para detenerlo, ejecuta: Stop-Process -Name cloudflared" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: No se pudo obtener la URL del tunnel" -ForegroundColor Red
    Write-Host "Revisa el log: $logFile" -ForegroundColor Yellow
}
