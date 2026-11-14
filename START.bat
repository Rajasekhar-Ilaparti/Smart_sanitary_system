@echo off
title Clean Gudlavalleru - server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is not installed. Please install it from https://nodejs.org  ^(LTS version^)
  echo.
  pause
  exit /b
)
start "" http://localhost:3000/
node server.js
pause
