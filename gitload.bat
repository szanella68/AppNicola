@echo off
setlocal enabledelayedexpansion

REM === Repo locale ===
cd /d C:\filepubblici\Nicola || (echo Cartella non trovata & pause & exit /b 1)

REM === Crea .gitkeep in tutte le directory VUOTE (salta .git e node_modules) ===
for /f "delims=" %%D in ('dir /ad /b /s') do (
  set "name=%%~nxD"
  if /i not "!name!"==".git" if /i not "!name!"=="node_modules" (
    dir "%%D\*" /a-d /b >nul 2>&1 || (echo.>"%%D\.gitkeep")
  )
)

echo Aggiungo tutte le modifiche, nuovi file e cancellazioni...
git add -A

REM Messaggio commit (default auto)
set /p commit_msg="Messaggio commit: "
if "%commit_msg%"=="" set "commit_msg=auto: update"

git commit -m "%commit_msg%" || (echo Nessuna modifica da commitare & goto push)

:push
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo Pusho su origin %BRANCH%...
git push origin %BRANCH%

echo Fatto.
pause
