@echo off
title Smart Health Platform Launcher
echo ====================================================
echo Starting Smart Health Platform (All Services)
echo ====================================================

set PG_DIR=C:\Users\anshv\pgsql\pgsql\bin
set PG_DATA=C:\Users\anshv\pgsql\data
set PG_LOG=C:\Users\anshv\pgsql\logfile.log

echo [1/4] Checking PostgreSQL database on port 5432...
"%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Starting PostgreSQL server...
    "%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start
    timeout /t 3 >nul
)
echo [OK] PostgreSQL database is active!

echo [2/4] Starting Central Backend on port 8000...
start "Smart Health Backend :8000" cmd /k "cd /d "%~dp0services\backend\smart-health-platform\backend" && npm run dev"

echo [3/4] Starting Governance Portal on port 3000...
start "Governance Portal :3000" cmd /k "cd /d "%~dp0apps\governance-portal" && npm run dev"

echo [4/4] Starting BRICS Portal on port 3001...
start "BRICS Portal :3001" cmd /k "cd /d "%~dp0apps\brics-portal" && npm run dev"

echo ====================================================
echo All services launched!
echo - Governance Portal:  http://localhost:3000
echo - AI Copilot:         http://localhost:3000/copilot
echo - BRICS Portal:       http://localhost:3001
echo - Backend GraphQL:    http://localhost:8000/graphql
echo ====================================================
