@echo off
set PG_DIR=C:\Users\anshv\pgsql\pgsql\bin
set PG_DATA=C:\Users\anshv\pgsql\data
set PG_LOG=C:\Users\anshv\pgsql\logfile.log

"%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" status >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] PostgreSQL is ALREADY running on port 5432.
) else (
    echo Starting PostgreSQL server...
    "%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start
    timeout /t 2 >nul
    "%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" status
)
