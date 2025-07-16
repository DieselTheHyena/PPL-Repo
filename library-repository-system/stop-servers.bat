@echo off
title Library Repository System - Stop Servers
color 0C

echo ========================================
echo   STOPPING LIBRARY REPOSITORY SYSTEM
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Stopping live-server processes...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Frontend Server*" >nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend Server*" >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo All servers have been stopped.
echo.
pause