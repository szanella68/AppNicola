@echo off
setlocal enabledelayedexpansion

:: === Config ===
set "REPO_DIR=C:\filepubblici\Nicola"

cd /d "%REPO_DIR%" || (echo Repo non trovata: %REPO_DIR% & pause & exit /b 1)
for /f "delims=" %%x in ('git rev-parse --is-inside-work-tree 2^>nul') do set INSIDE=%%x
if not "%INSIDE%"=="true" (echo Non e' una repo Git. & pause & exit /b 1)

echo ===== GIT SYNC =====

:: Crea .gitkeep nelle directory vuote (escluse .git e node_modules)
for /f "delims=" %%D in ('dir /ad /b /s') do (
  set "name=%%~nxD"
  if /i not "!name!"==".git" if /i not "!name!"=="node_modules" (
    dir "%%D\*" /a-d /b >nul 2>&1 || (echo.>"%%D\.gitkeep")
  )
)

echo Aggiungo tutte le modifiche...
git add -A

set HAVECHANGES=
for /f "delims=" %%f in ('git diff --cached --name-only') do set HAVECHANGES=1
if defined HAVECHANGES (
  set /p commit_msg="Messaggio commit (default: sync): "
  if "%commit_msg%"=="" set "commit_msg=sync"
  git commit -m "%commit_msg%" || goto afterCommit
) else (
  echo Nessuna modifica da commitare.
)

:afterCommit
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b

:: Se il branch remoto non esiste, crea upstream; altrimenti align con rebase e push
git ls-remote --exit-code --heads origin %BRANCH% >nul 2>&1
if errorlevel 1 (
  echo Creo upstream su origin/%BRANCH%...
  git push -u origin %BRANCH% || (echo Push fallito. & pause & exit /b 1)
) else (
  echo Pull --rebase da origin/%BRANCH%...
  git pull --rebase origin %BRANCH% || (echo Conflitti: risolvili e rilancia. & pause & exit /b 1)
  echo Push su origin/%BRANCH%...
  git push origin %BRANCH% || (echo Push fallito. & pause & exit /b 1)
)

echo.
echo ✅ Allineamento completato.
git status -sb
pause
