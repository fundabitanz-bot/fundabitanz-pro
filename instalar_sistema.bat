@echo off
title SGI ANZOATEGUI - CENTRO DE COMANDO V10
color 1f
cls

:MENU_PRINCIPAL
cls
echo =================================================================
echo   SGI CDCE ANZOATEGUI - GESTION DEL SISTEMA (EDICION ORO)
echo =================================================================
echo.
echo   [1] INICIAR SISTEMA (Modo Local / Electron)
echo       - Ejecuta el servidor y la interfaz de escritorio.
echo.
echo   [2] ACCESO REMOTO "RAPIDO" (Localtunnel)
echo       - URL temporal gratuita. Inestable.
echo.
echo   [3] ACCESO REMOTO "ALEATORIO" (Cloudflare Quick)
echo       - URL temporal segura (trycloudflare.com).
echo.
echo   [4] ACCESO REMOTO "ULTRA-VELOZ" (Tunnel SSH)
echo.
echo   [5] INSTALACION LIMPIA / REPARAR (Mantenimiento)
echo.
echo   [6] COMPILAR INSTALADOR EXE (Windows)
echo.
echo   [8] CONECTAR DOMINIO PROPIO (Cloudflare Token)
echo       - Requiere haber comprado un dominio ($12/anual).
echo       - Convierte tu PC en un servidor web oficial.
echo.
echo   [7] SALIR
echo.
echo =================================================================
set /p opcion="Seleccione una opcion (1-8): "

if "%opcion%"=="1" goto INICIAR
if "%opcion%"=="2" goto REMOTO_LT
if "%opcion%"=="3" goto REMOTO_CF
if "%opcion%"=="4" goto REMOTO_SSH
if "%opcion%"=="5" goto REINSTALAR
if "%opcion%"=="6" goto COMPILAR
if "%opcion%"=="8" goto REMOTO_PRO
if "%opcion%"=="7" exit
goto MENU_PRINCIPAL

:INICIAR
cls
color 0a
echo =================================================================
echo   INICIANDO SERVIDOR Y APLICACION SGI...
echo =================================================================
echo.
if not exist "node_modules" (
    color 4f
    echo [ALERTA] No se detectan librerias instaladas.
    timeout /t 3
    goto REINSTALAR
)
start /b node server.js
npm run electron:dev
pause
goto MENU_PRINCIPAL

:REMOTO_LT
cls
color 0b
echo =================================================================
echo   TUNEL REMOTO "LOCALTUNNEL" (ACCESO RAPIDO)
echo =================================================================
echo.
npx localtunnel --port 3001
pause
goto MENU_PRINCIPAL

:REMOTO_CF
cls
color 0d
echo =================================================================
echo   TUNEL REMOTO "CLOUDFLARE" (VERSION GRATUITA)
echo =================================================================
echo.
echo Iniciando descarga de binario Cloudflare (puede tardar un poco)...
npx cloudflared tunnel --url http://localhost:3001
pause
goto MENU_PRINCIPAL

:REMOTO_PRO
cls
color 09
echo =================================================================
echo   MODO PRODUCCION - DOMINIO PROPIO (SGI-ANZOATEGUI.COM)
echo =================================================================
echo.
echo   Para usar esta opcion, debes tener un TOKEN de Cloudflare Zero Trust.
echo   Esto vinculara este computador a tu dominio .com / .net / .ve
echo.
set /p token="PEGUE SU TOKEN DE CLOUDFLARE AQUI: "
echo.
echo   Iniciando tunel oficial... Si cierras esta ventana, la web se cae.
echo.
npx cloudflared tunnel run --token %token%
pause
goto MENU_PRINCIPAL

:REMOTO_SSH
cls
color 0e
echo =================================================================
echo   TUNEL SSH DIRECTO (TECNOLOGIA SIN INSTALACION)
echo =================================================================
echo.
ssh -R 80:localhost:3001 nokey@localhost.run
pause
goto MENU_PRINCIPAL

:COMPILAR
cls
color 0e
echo =================================================================
echo   GENERANDO INSTALADOR EXE PROFESIONAL
echo =================================================================
echo.
echo [1/2] Compilando interfaz web...
call npm run build
echo [2/2] Empaquetando ejecutable de Windows...
call npx electron-builder --win
echo.
echo [EXITO] Busque su instalador en la carpeta: dist_exe
pause
goto MENU_PRINCIPAL

:REINSTALAR
cls
color 4f
echo =================================================================
echo   REINSTALACION DEL SISTEMA (MODO BUNKER)
echo =================================================================
echo.
pause
echo [PASO 1/3] Limpiando...
if exist "node_modules" rmdir /s /q "node_modules"
if exist "package-lock.json" del "package-lock.json"
echo [PASO 2/3] Reinstalando dependencias...
call npm install
echo [PASO 3/3] Reconstruyendo SQLite y Seguridad...
call npm install better-sqlite3 electron-builder
call npm rebuild better-sqlite3
echo.
echo [EXITO] Sistema restaurado.
pause
goto MENU_PRINCIPAL