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

echo [2/6] Starting AI Engine on port 5000...
start "Smart Health AI Engine :5000" cmd /k "cd /d "%~dp0services\ai-engine" && python main.py"

echo [3/6] Starting Central Backend on port 8000...
start "Smart Health Backend :8000" cmd /k "cd /d "%~dp0services\backend\smart-health-platform\backend" && npm run dev"

echo [4/6] Starting Governance Portal on port 3000...
start "Governance Portal :3000" cmd /k "cd /d "%~dp0apps\governance-portal" && npm run dev"

echo [5/6] Starting BRICS Portal on port 3001...
start "BRICS Portal :3001" cmd /k "cd /d "%~dp0apps\brics-portal" && npm run dev"

echo [6/6] Starting PHC Portal on port 5173...
start "PHC Portal :5173" cmd /k "cd /d "%~dp0apps\phc-portal" && npm run dev"

echo ====================================================
echo All services launched!
echo - Governance Portal:  http://localhost:3000
echo - AI Copilot:         http://localhost:3000/copilot
echo - BRICS Portal:       http://localhost:3001
echo - PHC Portal:         http://localhost:5173
echo - Central Backend:    http://localhost:8000
echo - Backend GraphQL:    http://localhost:8000/graphql
echo - AI Engine API:      http://localhost:5000/docs
echo ====================================================
