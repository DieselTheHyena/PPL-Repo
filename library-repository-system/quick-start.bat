@echo off
title Library Repository System - Quick Start
color 0B

set BACKEND_DIR=%~dp0workspace\backend
set FRONTEND_DIR=%~dp0workspace\frontend

echo Starting Backend...
cd /d "%BACKEND_DIR%"
start "Backend" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
cd /d "%FRONTEND_DIR%"
start "Frontend" cmd /k "npx live-server --host=0.0.0.0"

echo.
echo Servers starting... Check the opened windows.
timeout /t 3 /nobreak >nul
exit