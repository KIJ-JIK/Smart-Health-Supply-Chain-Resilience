# Survey Report — Explorer 3: Runtime Environment, Services & Sync Investigation

**Date**: 2026-09-26  
**Investigator**: Explorer 3 (Runtime Environment, Services & Sync Investigator)  
**Target Paths**:
- Workspace: `C:\Users\anshv\OneDrive\Desktop\Smart_governance`
- Active Runtime: `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`
- Backend Service: `services/backend/smart-health-platform/backend`
- Portals: `apps/phc-portal`, `apps/governance-portal`, `apps/brics-portal`
- AI Engine: `services/ai-engine`

---

## Executive Summary

1. **Dual-Path Relationship & Synchronization**:
   - `C:\Users\anshv\OneDrive\Desktop\Smart_governance` is the active development workspace owned by `BLUE/anshv`.
   - `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience` is the active runtime directory created by OpenAI Codex sandbox (owned by `BLUE/CodexSandboxOnline`).
   - **Crucial Discovery**: **Zero automatic synchronization exists** between the two directories. No symlinks, junctions, background watchers, robocopy tasks, or git hooks are present.
   - **File Diffs**: Out of 352 trackable files, **exactly 1 substantive file difference** exists (`start_platform.bat`), 1 file exists only in Smart_governance (`apps/brics-portal/.env`), and 91 files differ solely by line endings (CRLF vs LF).
   - **Process Split**: Central Backend (:8000) was launched from `Smart_governance`. Governance Portal (:3000), BRICS Portal (:3001), and PHC Portal (:5173) are running out of the Codex directory (the latter two via mapped drive `V:`). Any code changes made in `Smart_governance` **must be synchronized to the Codex path** so Vite and Next.js live file watchers pick them up without needing restarts.

2. **Runtime Services & Health Matrix**:
   - **All 6 core services are online, healthy, and responding with HTTP 200**:
     * **Port 5432**: PostgreSQL 16 (PID 7884) — 23 tables, 136 PHC facilities, 10 states, 59 canonical districts, 1,530 inventory batches.
     * **Port 8000**: Central Express & Apollo GraphQL Backend (PID 27732) — `/health` HTTP 200, `/graphql` HTTP 200, `/api/v1/phc/facilities` HTTP 200 (51.6 KB). Global CORS middleware enables `*` on all routes with full preflight OPTIONS support.
     * **Port 3000**: Governance Portal Next.js 14 (PID 4416) — HTTP 200. Next.js internal rewrites proxy `/graphql` and `/api/v1/*` to port 8000.
     * **Port 3001**: BRICS Portal Vite (PID 20772) — HTTP 200. Vite proxy rewrites `/graphql`, `/sync`, and `/api` to port 8000.
     * **Port 5173**: PHC Operations Portal Vite (PID 31604) — HTTP 200. Directly fetches `http://localhost:8000`.
     * **Port 5000**: AI Engine FastAPI (PID 14312) — HTTP 200 `/docs`. CORS allows ports 8000, 3000, 5173, and 3001.

3. **R3 Cross-Portal Verification Suite Architecture**:
   - Current backend test suites (13 files in `backend/tests/`) rely on mocking `Pool.prototype.query` and do NOT verify live cross-tier database propagation.
   - Monorepo currently lacks an end-to-end cross-portal integration verification script.
   - Architectural blueprint designed for R3: A standalone TypeScript verification script (`verify_cross_portal_integration.ts`) runnable via `ts-node` and wired to `npm run test:integration` and root `npm run verify`. It executes a 6-step operational cycle: preflight health checks → PHC mutation → Governance multi-tier assertion (PHC, District, State, National) → Governance action / federated round → BRICS federated assertion → cleanup, exiting with code 0 on complete success.

---

## 1. Dual-Path Relationship & Synchronization Investigation

### 1.1 Filesystem & Git Comparison

| Metric | `Smart_governance` | Codex Runtime Path |
|---|---|---|
| **Full Path** | `C:\Users\anshv\OneDrive\Desktop\Smart_governance` | `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience` |
| **Git Remote** | `https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience.git` | `https://github.com/KIJ-JIK/Smart-Health-Supply-Chain-Resilience.git` |
| **Git Commit HEAD** | `d940710ec7d9c8f41735046ac5e6bd9365d64a76` | `d940710ec7d9c8f41735046ac5e6bd9365d64a76` |
| **Filesystem Owner** | `BLUE\anshv (S-1-5-21-4033795582-1196642487-2468168584-1001)` | `BLUE\CodexSandboxOnline (S-1-5-21-4033795582-1196642487-2468168584-1005)` |
| **Total Trackable Files** | 352 | 351 |
| **Symlinks / Junctions** | 0 | 0 |
| **Active Git Hooks** | 0 | 0 |
| **Active Watcher Tasks** | None | None |

### 1.2 Deep Content Diff Analysis

A file-by-file comparison (excluding `.git`, `node_modules`, `.next`, `dist`, `build`, `.agents`, `__pycache__`) revealed:
1. **CRLF vs LF Differences (91 files)**:
   - Due to Windows OneDrive checkout conventions, 91 files in `Smart_governance` use CRLF (`\r\n`), whereas in the Codex sandbox they use LF (`\n`).
   - When normalized for line endings, their file contents are 100% byte-for-byte identical.
2. **Substantive Differences (Exactly 1 file)**:
   - `start_platform.bat`:
     * In `Smart_governance`: Starts 6 services (PostgreSQL 5432, AI Engine 5000, Central Backend 8000, Governance Portal 3000, BRICS Portal 3001, and PHC Portal 5173).
     * In Codex path: Starts only 4 services (omits AI Engine on 5000 and PHC Portal on 5173).
3. **Files present in only one path**:
   - `apps/brics-portal/.env`: Present only in `Smart_governance`. Contains `VITE_USE_MOCK=true` and `VITE_BACKEND_URL=http://localhost:8000/graphql`.
   - `.agents/`: Present only in `Smart_governance` (Teamwork coordination metadata).

### 1.3 Active Process Execution Paths

| Port | Service | PID | Process Working Directory / Command Line | Source Workspace Path |
|---|---|---|---|---|
| **5432** | PostgreSQL Server | 7884 | `"C:/Users/anshv/pgsql/pgsql/bin/postgres.exe" -D "C:/Users/anshv/pgsql/data"` | `C:\Users\anshv\pgsql` |
| **8000** | Central Backend | 27732 | `node "C:\Users\anshv\OneDrive\Desktop\Smart_governance\services\backend\smart-health-platform\backend\node_modules\ts-node\dist\bin.js" src/index.ts` | **`Smart_governance`** |
| **3000** | Governance Portal | 4416 | `node "C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience\apps\governance-portal\node_modules\next\dist\server\lib\start-server.js"` | **Codex Runtime Path** |
| **3001** | BRICS Portal | 20772 | `node "V:\apps\brics-portal\node_modules\.bin\..\vite\bin\vite.js" --config vite.codex.config.mjs` | **Codex Runtime Path (`V:`)** |
| **5173** | PHC Portal | 31604 | `node "V:\apps\phc-portal\node_modules\.bin\..\vite\bin\vite.js"` | **Codex Runtime Path (`V:`)** |
| **5000** | AI Engine | 14312 | `"C:\Users\anshv\AppData\Local\Programs\Python\Python312\python.exe" main.py` | `Smart_governance\services\ai-engine` |

### 1.4 Synchronization Assessment & Protocol

- **Current State**: Independent working directories. Modifying code in `Smart_governance` does **not** update the running frontend code on ports 3000, 3001, or 5173 because Next.js and Vite watch the Codex directory.
- **Write Permission Verification**: Tested and confirmed that user `BLUE\anshv` has write/create/delete access inside `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`.
- **Recommended Synchronization Command**:
  ```powershell
  robocopy "C:\Users\anshv\OneDrive\Desktop\Smart_governance" "C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience" /E /XD .git node_modules .next dist build .agents __pycache__ .turbo /XF *.log /NDL /NFL /NJH /NJS
  ```
  This command takes ~0.5 seconds and instantly triggers Vite / Next.js Fast Refresh (HMR) in the active frontend portals.

---

## 2. Runtime Services, Health Checks & CORS Investigation

### 2.1 Service Configuration Matrix

| Service | Port | Process Name & PID | Health Endpoint | Startup Command |
|---|---|---|---|---|
| **PostgreSQL** | 5432 | `postgres.exe` (7884) | SQL query `SELECT 1;` | `"%PG_DIR%\pg_ctl.exe" -D "%PG_DATA%" start` |
| **Central Backend** | 8000 | `node.exe` (27732) | `GET http://localhost:8000/health` (200)<br>`GET http://localhost:8000/` (200) | `cd services/backend/smart-health-platform/backend && npm run dev` |
| **AI Engine** | 5000 | `python.exe` (14312) | `GET http://localhost:5000/` (200)<br>`GET http://localhost:5000/docs` (200) | `cd services/ai-engine && python main.py` |
| **Governance Portal** | 3000 | `node.exe` (4416) | `GET http://localhost:3000/` (200) | `cd apps/governance-portal && npm run dev` |
| **BRICS Portal** | 3001 | `node.exe` (20772) | `GET http://localhost:3001/` (200) | `cd apps/brics-portal && npm run dev` |
| **PHC Portal** | 5173 | `node.exe` (31604) | `GET http://localhost:5173/` (200) | `cd apps/phc-portal && npm run dev` |

### 2.2 Endpoint Probing Results

| Endpoint Probed | Method | Status Code | Verified Payload / Headers |
|---|---|---|---|
| `http://localhost:8000/health` | GET | **HTTP 200** | `{"status":"ok","timestamp":"2026-09-26T12:49:24.435Z"}` |
| `http://localhost:8000/` | GET | **HTTP 200** | `{"service":"smart-health-backend","status":"online","version":"1.0.0"}` |
| `http://localhost:8000/graphql` | GET | **HTTP 200** | `{"status":"GraphQL endpoint ready. Use POST /graphql with query payload."}` |
| `http://localhost:8000/graphql` | POST | **HTTP 200** | `{"data":{"nationalOverview":{"totalPhcs":136,"activePhcs":129,"totalBeds":4318,"occupiedBeds":2440}}}` |
| `http://localhost:8000/api/v1/phc/facilities` | GET | **HTTP 200** | Returns 136 real PHC facilities (51,628 bytes) |
| `http://localhost:3000/` | GET | **HTTP 200** | Governance Portal HTML (`<meta charSet="utf-8"/>...`) |
| `http://localhost:3000/graphql` | POST | **HTTP 200** | Next.js internal rewrite to port 8000: `{"data":{"nationalOverview":{"totalPhcs":136}}}` |
| `http://localhost:3001/` | GET | **HTTP 200** | BRICS Portal HTML (`class="bg-[#f8fafc]"`...) |
| `http://localhost:3001/graphql` | POST | **HTTP 200** | Vite proxy to port 8000: `{"data":{"federatedNodes":[{"countryCode":"IN"},...]}}` |
| `http://localhost:5173/` | GET | **HTTP 200** | PHC Operations Portal HTML |
| `http://localhost:5000/` | GET | **HTTP 200** | `{"service":"Smart Health AI & Optimization Engine","status":"online"}` |
| `http://localhost:5000/docs` | GET | **HTTP 200** | FastAPI Swagger UI |

### 2.3 CORS Configuration Analysis

1. **Central Backend (`services/backend/smart-health-platform/backend/src/index.ts`, lines 8–18)**:
   ```typescript
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Device-Cert, X-Device-ID, X-PHC-ID');
     if (req.method === 'OPTIONS') {
       res.sendStatus(200);
       return;
     }
     next();
   });
   ```
   - Preflight `OPTIONS` probe: Verified `HTTP 200`, `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`.
   - All browser frontends can issue cross-origin requests directly to Port 8000 without CORS blocking.

2. **Governance Portal (`apps/governance-portal/next.config.js`, lines 6–12)**:
   ```javascript
   async rewrites() {
     const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/graphql', '') || 'http://localhost:8000';
     return [
       { source: '/graphql',       destination: `${backendUrl}/graphql` },
       { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
     ];
   }
   ```
   - Front-end queries calling relative path `/graphql` are rewritten by Next.js server-side, avoiding CORS entirely.

3. **BRICS Portal (`apps/brics-portal/vite.config.ts`, lines 13–29)**:
   ```typescript
   server: {
     port: 3001,
     proxy: {
       '/graphql': { target: 'http://localhost:8000', changeOrigin: true },
       '/sync':    { target: 'http://localhost:8000', changeOrigin: true },
       '/api':     { target: 'http://localhost:8000', changeOrigin: true },
     },
   }
   ```
   - Vite dev server proxies `/graphql` directly to port 8000.

4. **PHC Portal (`apps/phc-portal`)**:
   - `apps/phc-portal/src/services/phcBackendService.ts` and `apps/phc-portal/src/hooks/useSyncEngine.ts` use `VITE_BACKEND_URL || 'http://localhost:8000'`.
   - Requests are direct cross-origin to `http://localhost:8000`. Since port 8000 serves `Access-Control-Allow-Origin: *`, requests succeed cleanly.

### 2.4 Mock Fallback Deactivation Locations

- **BRICS Portal**:
  * `apps/brics-portal/.env`: `VITE_USE_MOCK=true` must be set to `false` or removed.
  * `apps/brics-portal/src/graphql/client.ts` (lines 20–48): Remove `resilientFallbackLink` and `mockLink` fallback.
- **Governance Portal**:
  * `apps/governance-portal/src/lib/apolloClient.ts` (lines 73–125): Eliminate `mockLink` and `mockResolvers` fallback.
- **PHC Portal**:
  * `apps/phc-portal/src/services/phcBackendService.ts` (lines 22–56): Eliminate `FALLBACK_FACILITIES` array and fallback branch in `fetchFacilities` and `verifyLogin`.
  * `apps/phc-portal/src/hooks/useSyncEngine.ts` (line 19): Ensure `useLiveServer` is locked to `true` and remove `mockBackendServer` fallbacks.

---

## 3. Existing Test Runners, Package Scripts & R3 Architecture

### 3.1 Existing Test Suites Inventory

| Path | Runner / Framework | Current Status | Description |
|---|---|---|---|
| `services/ai-engine/tests/test_ai_engine.py` | Python standard `unittest` | **Passing (9 tests, 1.33s)** | Tests health, demand forecasting, anomaly detection, risk scoring, redistribution optimization |
| `backend/tests/test_api_contracts.ts` | `ts-node` | Tests 1 & 2 pass; Test 3 fails (missing `packages/api-contracts/dist`) | Validates OpenAPI 3.0.3 YAML and GraphQL Schema definitions |
| `backend/tests/test_chunk10_consumption_workforce_footfall.ts` | `ts-node` | Unit test with mocked pg Pool | Tests consumption velocity, workforce, and footfall services |
| `backend/tests/test_chunk11_requests_alerts.ts` | `ts-node` | Unit test with mocked pg Pool | Tests resource requests and alert fanout |
| `backend/tests/test_chunk12_event_catalog.ts` | `ts-node` | Unit test with mocked pg Pool | Tests event catalog, Kafka/in-memory bus |
| `backend/tests/test_chunk13_governance_config.ts` | `ts-node` | Unit test with mocked pg Pool | Tests GraphQL resolvers with intercepted mock SQL rows |
| `backend/tests/test_chunk14_ai_brics.ts` | `ts-node` | Unit test with mocked pg Pool | Tests AI integration seams and BRICS federated round models |
| `backend/tests/test_chunk15_supply_chain_audit.ts` | `ts-node` | Unit test with mocked pg Pool | Tests supply chain purchase orders and audit log |
| `backend/tests/test_chunk16_observability_cross_team.ts` | `ts-node` | Unit test with mocked pg Pool | Tests Prometheus metrics and latency middleware |
| `backend/tests/test_auth_device.ts` | `ts-node` | Unit test | Tests device certificate issuance and signature verification |
| `backend/tests/test_billing_fefo.ts` | `ts-node` | Unit test | Tests FEFO inventory deduction algorithm |
| `backend/tests/test_facility_inventory.ts` | `ts-node` | Unit test | Tests facility CRUD and inventory batch management |
| `backend/tests/test_rls_matrix.ts` | `ts-node` | Unit test | Tests row-level security policy matrix |
| `backend/tests/test_sync_engine.ts` | `ts-node` | Unit test | Tests offline sync push/pull watermark engine |

### 3.2 Key Finding on Existing Tests
**Zero existing tests execute end-to-end against the live PostgreSQL database across portals.** All existing backend tests either test contracts statically or patch `Pool.prototype.connect()` and `Pool.prototype.query()` to inject mock rows.

### 3.3 Architecture Blueprint for R3 (Cross-Portal Integration Verification Suite)

#### File Locations
- Script: `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts`
- Package Scripts:
  * In `services/backend/smart-health-platform/backend/package.json`:
    `"test:integration": "ts-node tests/verify_cross_portal_integration.ts"`
  * In root `package.json`:
    `"verify": "npm --prefix services/backend/smart-health-platform/backend run test:integration"`,
    `"test:integration": "npm --prefix services/backend/smart-health-platform/backend run test:integration"`

#### Detailed Verification Cycle Steps

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  R3 Cross-Portal Verification Cycle Flow                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
  Step 1: Preflight Health & Connectivity Checks
  ├── Probe Port 8000 /health (HTTP 200, status: ok)
  ├── Probe Port 3000 / (HTTP 200)
  ├── Probe Port 3001 / (HTTP 200)
  ├── Probe Port 5173 / (HTTP 200)
  ├── Probe Port 5000 /docs (HTTP 200)
  └── Query PostgreSQL port 5432 (Assert 136 PHCs in smarthealth)
                                      │
  Step 2: PHC Portal Mutation (Simulating Clinic Entry)
  ├── Select canonical facility: "Kothrud PHC" (id: c0000003-0000-0000-0000-000000000001)
  ├── Query baseline occupied beds (e.g. 18) and baseline medicine stock (e.g. Amoxicillin)
  ├── Execute Mutation: Update occupied beds (18 → 24) via PUT /api/v1/phc/:phcId/facility
  └── Execute Mutation: Adjust medicine batch quantity via POST /api/v1/phc/:phcId/inventory/:batchId/adjust
                                      │
  Step 3: Governance Portal Multi-Tier Assertion
  ├── Query GraphQL phcDetail(phcId: "c0000003-0000-0000-0000-000000000001")
  │   └── Assert: occupiedBeds === 24
  ├── Query GraphQL districtOverview(districtId: "d0000002-0000-0000-0000-000000000001") [Pune District]
  │   └── Assert: district aggregated occupied beds reflect +6 increase
  ├── Query GraphQL stateOverview(stateId: "s0000001-0000-0000-0000-000000000001") [Maharashtra]
  │   └── Assert: state aggregated occupied beds reflect +6 increase
  └── Query GraphQL nationalOverview
      └── Assert: national totalBeds and occupiedBeds match database sum exactly
                                      │
  Step 4: Governance Decision Execution
  ├── Trigger Governance Mutation: decideRedistribution (transferId: "rt-001", decision: "approved")
  └── OR Trigger Governance Mutation: startFederatedRound (modelId: "demand-forecaster-v2", targetEpsilon: 1.5)
                                      │
  Step 5: BRICS Portal Intelligence Assertion
  ├── Query GraphQL federatedRounds
  │   └── Assert: latest round reflects new status or newly created round ID
  ├── Query GraphQL federatedNodes
  │   └── Assert: 5 BRICS countries (IN, BR, RU, CN, ZA) returned with activeModelVersion
  └── Query GraphQL privacyBudgetLedger
      └── Assert: ledger records consumption for participating nodes
                                      │
  Step 6: Teardown & Idempotency Cleanup
  ├── Revert occupied beds back to baseline (24 → 18)
  ├── Revert inventory adjustment
  └── Confirm database returns to clean initial state
                                      │
  Step 7: Exit Code & Summary Log
  ├── Log explicit [PASS] or [FAIL] for each assertion
  └── If all passed: process.exit(0); else process.exit(1)
```

---

## 4. Key Recommendations for Implementation Agents

1. **Dual-Path Synchronization**:
   - The implementer agent MUST run the `robocopy` synchronization command whenever frontend files (`apps/phc-portal`, `apps/governance-portal`, `apps/brics-portal`) are modified in `Smart_governance`.
   - The Next.js and Vite servers running in `Documents\Codex` do NOT need to be killed or restarted—their file watchers will automatically reload changed modules.

2. **CORS & Port Alignment**:
   - Do NOT change backend port 8000, Governance port 3000, or BRICS port 3001.
   - PHC portal should keep running on port 5173.
   - All CORS origins are already handled by `*` on port 8000 and FastAPI CORS middleware on port 5000.

3. **Mock Data Deletion**:
   - Delete/disable `apps/brics-portal/.env` setting `VITE_USE_MOCK=true`.
   - In `apps/brics-portal/src/graphql/client.ts`, eliminate `resilientFallbackLink` fallback to `mockLink`.
   - In `apps/governance-portal/src/lib/apolloClient.ts`, remove `mockLink` and force `httpLink` via `/graphql`.
   - In `apps/phc-portal/src/services/phcBackendService.ts`, remove `FALLBACK_FACILITIES` and ensure API failures throw rather than render mock data.

4. **R3 Verification Runner**:
   - Create `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts`.
   - Add `"test:integration": "ts-node tests/verify_cross_portal_integration.ts"` to `backend/package.json`.
   - Add `"verify": "npm --prefix services/backend/smart-health-platform/backend run test:integration"` to root `package.json`.
   - Ensure the script exits with code 0 on success.
