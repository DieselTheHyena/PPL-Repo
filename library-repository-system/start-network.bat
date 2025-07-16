@echo off
title Library Repository System - Network Server
color 0A

echo ========================================
echo   LIBRARY REPOSITORY SYSTEM
echo   Network Server Startup
echo ========================================
echo.

echo Starting services...
echo.

set BACKEND_DIR=%~dp0workspace\backend
set FRONTEND_DIR=%~dp0workspace\frontend

if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found!
    echo Expected: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found!
    echo Expected: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo [1/3] Installing/Updating Backend Dependencies...
cd /d "%BACKEND_DIR%"
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo [2/3] Installing/Updating Frontend Dependencies...
cd /d "%FRONTEND_DIR%"
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [3/3] Starting Servers...
echo.

echo Starting Backend Server...
cd /d "%BACKEND_DIR%"
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
cd /d "%FRONTEND_DIR%"
start "Frontend Server" cmd /k "npx live-server --host=0.0.0.0 --port=8080"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not "%%b"=="127.0.0.1" (
            echo Network Access: http://%%b:8080
        )
    )
)

echo Local Access: http://localhost:8080
echo.
echo Press any key to open local browser...
pause >nul

start http://localhost:8080

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause