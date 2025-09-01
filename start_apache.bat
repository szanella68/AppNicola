@echo on
setlocal EnableExtensions

rem --- PERCORSI APACHE (XAMPP) ---
set "APACHE_BIN=C:\xampp\apache\bin\httpd.exe"
set "APACHE_CONF=C:\xampp\apache\conf\httpd.conf"
set "APACHE_ROOT=C:\xampp\apache"
set "APACHE_LOGS=C:\xampp\apache\logs"

if not exist "%APACHE_BIN%" (
  echo [ERRORE] Apache non trovato: %APACHE_BIN%
  goto HOLD
)

echo [TEST] Sintassi...
"%APACHE_BIN%" -t -f "%APACHE_CONF%"
if errorlevel 1 goto HOLD

rem --- evita doppio avvio: controlla la 443 ---
netstat -ano | findstr /r /c:":443 .*LISTENING" >nul
if not errorlevel 1 (
  echo [Apache] gia' attivo su :443. Niente rilancio.
  goto HOLD
)

echo -----------------------------------------
echo [RUN] Apache in FOREGROUND (Ctrl+C per fermare)
echo (errori runtime visibili qui; la finestra resta aperta)
echo -----------------------------------------
"%APACHE_BIN%" -f "%APACHE_CONF%" -d "%APACHE_ROOT%" -e info -E "%APACHE_LOGS%\startup-guard.log"
echo [EXIT] Codice: %errorlevel%

:HOLD
echo.
echo (Apache-SSL) Finestra bloccata. Premi un tasto per chiudere...
pause >nul
endlocal
