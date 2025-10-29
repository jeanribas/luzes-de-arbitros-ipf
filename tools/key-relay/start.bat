@echo off
setlocal
cd /d "%~dp0"

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
set STATUS=%ERRORLEVEL%

if %STATUS% neq 0 (
  echo.
  echo O helper terminou com codigo %STATUS%.
  pause
)

exit /b %STATUS%
