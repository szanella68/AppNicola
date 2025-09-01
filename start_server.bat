@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  LAUNCH NICOLA: per ora solo Apache (443)
echo  (in futuro sbloccherai l'avvio di Nicola)
echo ============================================

rem --- avvia Apache in foreground (finestra che resta aperta) ---
start "Apache-SSL" cmd /k "%cd%\start_apache.bat"

echo.
echo Finestre attese:
echo  - Apache-SSL (aperta ora)
echo.
echo Per avviare anche NICOLA piu' avanti:
echo   - sblocca la riga commentata qui sotto.
start "Nicola PROD" cmd /k "%cd%\start_nicola.bat"
echo.
pause
endlocal
