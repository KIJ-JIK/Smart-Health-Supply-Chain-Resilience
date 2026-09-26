# Handoff Report — Explorer 3: Runtime Environment, Services & Sync Investigator

**Agent**: Explorer 3 (Runtime Environment, Services & Sync Investigator)  
**Date**: 2026-09-26  
**Working Directory**: `C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_3`  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

1. **Dual-Path Working Directories**:
   - `C:\Users\anshv\OneDrive\Desktop\Smart_governance` has Git HEAD `d940710ec7d9c8f41735046ac5e6bd9365d64a76` and is owned by `BLUE\anshv`.
   - `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience` has identical Git HEAD `d940710ec7d9c8f41735046ac5e6bd9365d64a76` and is owned by `BLUE\CodexSandboxOnline`.
   - Python recursive file comparison found 352 trackable files in `Smart_governance` vs 351 in Codex.
   - Out of all common files, **91 files differ strictly by line endings** (CRLF in `Smart_governance` vs LF in Codex), while **exactly 1 substantive file difference** exists: `start_platform.bat`.
   - `start_platform.bat` in `Smart_governance` (lines 20-34) launches 6 services including AI Engine (`python main.py` on port 5000) and PHC Portal (`npm run dev` on port 5173). In the Codex path, `start_platform.bat` omits these two services.
   - Exactly 1 file exists only in `Smart_governance`: `apps\brics-portal\.env` containing:
     ```
     VITE_USE_MOCK=true
     VITE_BACKEND_URL=http://localhost:8000/graphql
     ```
   - Filesystem scan revealed **0 symlinks or junctions** in either directory, and **0 active git hooks** in `.git/hooks`.
   - Process scan (`tasklist`) confirmed **no background file sync or watcher processes** (e.g. robocopy, rsync, chokidar) syncing the two directories.

2. **Active Runtime Processes & Listening Ports**:
   - Running processes inspected via `Get-CimInstance Win32_Process` and `Get-NetTCPConnection`:
     * **Port 5432**: `postgres.exe` (PID 7884) running from `C:/Users/anshv/pgsql/data`. Database `smarthealth` contains 23 tables, 136 PHC facilities, 10 states, 59 canonical districts, and 1,530 inventory batches.
     * **Port 8000**: `node.exe` (PID 27732) executing `"node" "C:\Users\anshv\OneDrive\Desktop\Smart_governance\services\backend\smart-health-platform\backend\node_modules\ts-node\dist\bin.js" src/index.ts`.
     * **Port 3000**: `node.exe` (PID 4416) executing `"node" C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience\apps\governance-portal\node_modules\next\dist\server\lib\start-server.js`.
     * **Port 3001**: `node.exe` (PID 20772) executing `"node" "V:\apps\brics-portal\node_modules\vite\bin\vite.js" --config vite.codex.config.mjs` (Vite dev server for BRICS Portal).
     * **Port 5173**: `node.exe` (PID 31604) executing `"node" "V:\apps\phc-portal\node_modules\vite\bin\vite.js"` (Vite dev server for PHC Portal).
     * **Port 5000**: `python.exe` (PID 14312) executing `python main.py` in `services\ai-engine`.

3. **Live Health & CORS Verification**:
   - HTTP probes to all active ports:
     * `http://localhost:8000/health` -> HTTP 200 `{"status":"ok","timestamp":"2026-09-26T12:49:24.435Z"}`
     * `http://localhost:8000/` -> HTTP 200 `{"service":"smart-health-backend","status":"online","version":"1.0.0"}`
     * `http://localhost:8000/graphql` -> HTTP 200 with data query: `{"data":{"nationalOverview":{"totalPhcs":136,"activePhcs":129,"totalBeds":4318,"occupiedBeds":2440}}}`
     * `http://localhost:8000/api/v1/phc/facilities` -> HTTP 200, length 51,628 bytes, returns 136 real PHCs.
     * `http://localhost:3000/` -> HTTP 200 (Governance Next.js HTML)
     * `http://localhost:3000/graphql` -> HTTP 200 (Next.js rewrite to port 8000: `{"data":{"nationalOverview":{"totalPhcs":136}}}`)
     * `http://localhost:3001/` -> HTTP 200 (BRICS Vite HTML)
     * `http://localhost:3001/graphql` -> HTTP 200 (Vite proxy to port 8000: `{"data":{"federatedNodes":[{"countryCode":"IN"},...]}}`)
     * `http://localhost:5173/` -> HTTP 200 (PHC Vite HTML)
     * `http://localhost:5000/docs` -> HTTP 200 (FastAPI Swagger UI)
   - CORS validation on Port 8000:
     * `OPTIONS /graphql` with `Origin: http://localhost:3000` -> HTTP 200, headers `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`.
     * `services/backend/smart-health-platform/backend/src/index.ts` lines 8-18 implement global CORS middleware setting `*`.

4. **Existing Tests & Package Scripts**:
   - In `backend/package.json`:
     * Script `"test"` runs `ts-node tests/test_chunk14_ai_brics.ts`.
     * Script `"test:all"` chains 8 `ts-node tests/...` scripts.
     * 13 test files exist in `backend/tests/`. All integration tests (e.g. `test_chunk13`, `test_chunk14`) mock the PostgreSQL `Pool.prototype.query` and inject fake data.
   - In `services/ai-engine/tests/test_ai_engine.py`:
     * Python `unittest` suite ran: `Ran 9 tests in 1.332s OK`.
   - In root `package.json`:
     * Only contains `dev`, `dev:*`, and `build` scripts. No test or verification script exists.
   - Monorepo currently has **no end-to-end integration test runner** that executes against the live database or live ports.

---

## 2. Logic Chain

1. **Dual-Path Synchronization Need**:
   - Observation 2 demonstrates that Central Backend (:8000) runs out of `Smart_governance`, while Governance Portal (:3000), BRICS Portal (:3001), and PHC Portal (:5173) run out of the Codex directory (`C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`).
   - Observation 1 demonstrates that no automated synchronization currently exists between `Smart_governance` and the Codex runtime path.
   - Therefore, any code edits made to frontend files (`apps/governance-portal`, `apps/brics-portal`, `apps/phc-portal`) inside `Smart_governance` will **never** appear in the active running web browsers unless they are mirrored to the Codex directory.
   - Since user `anshv` was verified to have write/delete permissions in the Codex directory, running a targeted `robocopy` command after any code edit in `Smart_governance` ensures the live Next.js / Vite file watchers instantly trigger hot module replacement (HMR).

2. **Service Health & Port Allocation**:
   - Observation 2 and Observation 3 confirm that all 6 required services are alive and functioning:
     * PostgreSQL: 5432
     * Central Backend: 8000
     * AI Engine: 5000
     * Governance Portal: 3000
     * BRICS Portal: 3001
     * PHC Portal: 5173
   - Port 8000 is correctly configured with `Access-Control-Allow-Origin: *` and preflight handling.
   - Governance Portal (3000) and BRICS Portal (3001) proxy `/graphql` cleanly to port 8000.
   - PHC Portal (5173) communicates directly with port 8000 cross-origin without CORS issues.

3. **Requirement R3 Architecture**:
   - Observation 4 shows that all existing test scripts mock the database and run in isolation. None test the live cross-tier cycle requested in R3.
   - Therefore, a dedicated verification runner `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts` must be created.
   - The runner must be wired into `backend/package.json` as `npm run test:integration` and into root `package.json` as `npm run verify`.
   - The runner must execute real HTTP and GraphQL calls against `http://localhost:8000`:
     * Verify all 5 HTTP endpoints are 200.
     * Execute a PHC mutation (bed or inventory update).
     * Assert multi-tier propagation in Governance GraphQL (phcDetail, districtOverview, stateOverview, nationalOverview).
     * Execute a Governance action (redistribution approval or start federated round).
     * Assert updated federated intelligence in BRICS GraphQL (federatedRounds, federatedNodes, privacyBudgetLedger).
     * Clean up / revert test mutations.
     * Exit with code 0 on complete pass.

---

## 3. Caveats

- Drive `V:` mapping: The Vite processes for PHC (PID 31604) and BRICS (PID 20772) show command lines starting with `V:\apps\...`. `V:` was mapped in the logon session of `BLUE\CodexSandboxOnline`. Direct path access via `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience\apps\...` refers to the exact same underlying files on disk. Synchronizing files to the Codex directory updates the files regardless of drive letter.
- Node modules in Codex: Do not delete or overwrite `node_modules` in the Codex directory during synchronization. The `robocopy` command must always include `/XD node_modules .git .next dist build .agents __pycache__ .turbo`.

---

## 4. Conclusion

1. **Dual-Path Strategy**: Maintain `C:\Users\anshv\OneDrive\Desktop\Smart_governance` as the primary editing workspace. Execute the `robocopy` synchronization command after any frontend or shared code changes so the running Next.js / Vite instances in `Documents\Codex` update automatically via HMR.
2. **Runtime Services**: All 6 services on ports 5432, 8000, 3000, 3001, 5173, and 5000 are already running, healthy, and communicating with PostgreSQL and each other without CORS errors.
3. **Mock Data Elimination Strategy**: Set `VITE_USE_MOCK=false` in `apps/brics-portal/.env`, delete `resilientFallbackLink` in `apps/brics-portal/src/graphql/client.ts`, eliminate `mockLink` in `apps/governance-portal/src/lib/apolloClient.ts`, and remove `FALLBACK_FACILITIES` in `apps/phc-portal/src/services/phcBackendService.ts`.
4. **R3 Verification Suite**: Implement `verify_cross_portal_integration.ts` in `services/backend/smart-health-platform/backend/tests/`, add `npm run test:integration` and root `npm run verify`, and ensure it executes the full live operational cycle and exits with code 0.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Live Service Ports & Health**:
   Run:
   ```powershell
   python -c "import urllib.request; [print(p, urllib.request.urlopen(u).status) for p, u in [('8000', 'http://localhost:8000/health'), ('3000', 'http://localhost:3000'), ('3001', 'http://localhost:3001'), ('5173', 'http://localhost:5173'), ('5000', 'http://localhost:5000/docs')]]"
   ```
   *Expected*: All return HTTP 200.

2. **Verify PostgreSQL Live Records**:
   Run:
   ```cmd
   "C:\Users\anshv\pgsql\pgsql\bin\psql.exe" -U postgres -d smarthealth -c "SELECT count(*) FROM phc_facilities;"
   ```
   *Expected*: Exactly 136 PHC facilities.

3. **Verify Dual-Path Sync**:
   Run:
   ```powershell
   robocopy "C:\Users\anshv\OneDrive\Desktop\Smart_governance" "C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience" /E /XD .git node_modules .next dist build .agents __pycache__ .turbo /XF *.log /NDL /NFL /NJH /NJS
   ```
   *Expected*: Exits with code 0 or 1 (robocopy success code).
