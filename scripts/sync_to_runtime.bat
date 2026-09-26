@echo off
setlocal

echo ==============================================================================
echo [DUAL-PATH SYNC] Synchronizing Workspace to Runtime Directory
echo Source:      C:\Users\anshv\OneDrive\Desktop\Smart_governance
echo Destination: C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience
echo ==============================================================================

robocopy "C:\Users\anshv\OneDrive\Desktop\Smart_governance" "C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience" /E /XD node_modules .git .next dist .agents .gemini /XF .env.local /R:1 /W:1 /NP /NFL /NDL

set ROBO_EXIT=%ERRORLEVEL%
if %ROBO_EXIT% LEQ 7 (
    echo [DUAL-PATH SYNC] Synchronization successful. Robocopy exit code: %ROBO_EXIT%
    exit /b 0
) else (
    echo [DUAL-PATH SYNC] Robocopy encountered an error. Robocopy exit code: %ROBO_EXIT%
    exit /b %ROBO_EXIT%
)
