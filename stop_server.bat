@echo off
cd /d "%~dp0"
start "STOP NICOLA" cmd /k "%~dp0stop_core.bat"
