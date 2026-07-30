@echo off
echo ========================================
echo Cloudflare Tunnel para Supabase
echo ========================================
echo.
echo Este script crea un tunel que da acceso IPv6 a Supabase
echo desde tu red local (que solo tiene IPv4).
echo.
echo IMPORTANTE: Deja esta ventana abierta mientras desarrollas.
echo Para cerrar el tunel, presiona Ctrl+C.
echo.

:: Verificar que cloudflared esta instalado
where cloudflared >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: cloudflared no esta instalado.
    echo Descargalo desde: https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
)

:: Iniciar el tunel hacia Supabase
echo Iniciando tunel IPv6 a Supabase...
echo.
cloudflared tunnel --url tcp://db.bmrqlujvkkmtxjvuqrph.supabase.co:5432
