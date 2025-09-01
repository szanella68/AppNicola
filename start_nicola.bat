@echo on
setlocal EnableExtensions

rem === MODIFICA QUESTO PERCORSO CON LA CARTELLA DELL'APP NICOLA ===
set "NICOLA_DIR=C:\filepubblici\AppNicola"
set "NICOLA_PORT=3007"

cd /d "%NICOLA_DIR%"

where node
if errorlevel 1 (
  echo [ERRORE] Node.js non nel PATH.
  goto HOLD
)

rem evita doppio avvio: se 3007 gia' in LISTENING non rilancia
netstat -ano | findstr /r /c:":%NICOLA_PORT% .*LISTENING" >nul
if not errorlevel 1 (
  echo [Nicola] gia' attivo su :%NICOLA_PORT%. Niente rilancio.
  goto HOLD
)

set "PORT=%NICOLA_PORT%"
set "NODE_ENV=production"
set "FRONTEND_URL=https://zanserver.sytes.net/nicola"

echo -----------------------------------------
echo [RUN] NICOLA PRODUZIONE su porta %PORT%
echo -----------------------------------------
node -v
rem Consigliato nel codice: app.set("trust proxy", true);
rem Se hai un entry diverso da server.js, cambialo qui sotto
node server.js
echo [EXIT] Codice: %errorlevel%

:HOLD
echo.
echo (Nicola) Finestra bloccata. Premi un tasto per chiudere...
pause >nul
endlocal
