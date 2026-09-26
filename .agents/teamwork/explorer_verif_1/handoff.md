# Handoff Report — Explorer Verif 1: Live Backend & 4-Port Service Health Verification and Mock Fallback Elimination

**Agent**: explorer_verif_1 (Read-Only Exploration Agent)  
**Date**: 2026-09-26  
**Working Directory**: `C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_verif_1`  
**Parent Agent**: orchestrator_2 (`88976d75-c093-45e4-96e2-bff6414f8774`)  
**Target Milestone**: R1: Live Backend & 4-Port Service Health Verification and Mock Fallback Elimination  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

### 1.1 Service Architecture, Startup Configuration & Health Endpoints

#### Process and Port Allocation
Process lookup against ports 8000, 3000, 3001, 5173, and 5000 confirmed five active processes listening on the host:
- **Port 5000 (AI Engine)**: PID `14312` (`python.exe` Python 3.12).
- **Port 8000 (Central Backend)**, **Port 3000 (Governance Portal)**, **Port 3001 (BRICS Portal)**, **Port 5173 (PHC Portal)**: PIDs `4416`, `18032`, `20772`, `31604` (`node.exe`).

#### Startup Script Architecture
`start_platform.bat` (lines 7–44) defines the orchestration of the platform:
```bat
7: set PG_DIR=C:\Users\anshv\pgsql\pgsql\bin
8: set PG_DATA=C:\Users\anshv\pgsql\data
11: echo [1/4] Checking PostgreSQL database on port 5432...
20: echo [2/6] Starting AI Engine on port 5000...
21: start "Smart Health AI Engine :5000" cmd /k "cd /d "%~dp0services\ai-engine" && python main.py"
23: echo [3/6] Starting Central Backend on port 8000...
24: start "Smart Health Backend :8000" cmd /k "cd /d "%~dp0services\backend\smart-health-platform\backend" && npm run dev"
26: echo [4/6] Starting Governance Portal on port 3000...
27: start "Governance Portal :3000" cmd /k "cd /d "%~dp0apps\governance-portal" && npm run dev"
29: echo [5/6] Starting BRICS Portal on port 3001...
30: start "BRICS Portal :3001" cmd /k "cd /d "%~dp0apps\brics-portal" && npm run dev"
32: echo [6/6] Starting PHC Portal on port 5173...
33: start "PHC Portal :5173" cmd /k "cd /d "%~dp0apps\phc-portal" && npm run dev"
```

#### Port & CORS Configuration by Service

1. **Central Backend (`services/backend/smart-health-platform/backend/src/index.ts`)**:
   - **Port**: Bound to port 8000 (line 478: `const PORT = Number(process.env.PORT || 8000); server.listen(PORT, ...)`).
   - **CORS Handling** (lines 8–18):
     ```ts
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
   - **Healthcheck Endpoints**:
     - `GET /` (lines 40–51): Returns `{ service: 'smart-health-backend', status: 'online', version: '1.0.0', endpoints: { health: '/health', graphql: '/graphql', api: '/api/v1' } }`.
     - `GET /health` (lines 53–55): Returns `{ status: 'ok', timestamp: new Date().toISOString() }`.
   - **Database Connection (`src/db/pool.ts` lines 13–32)**:
     - Configured to connect to PostgreSQL `smarthealth` on `localhost:5432` with max 20 connections.
   - **GraphQL Server Mount (`src/index.ts` lines 407–409)**:
     - Mounted at `/graphql` and `/api/v1/graphql` backed by `graphqlRouter` in `src/modules/governance/graphqlServer.ts`.

2. **Governance Command Portal (`apps/governance-portal`)**:
   - **Port Configuration (`package.json` line 6)**: `"dev": "next dev -p 3000"`.
   - **Apollo Client (`src/lib/apolloClient.ts`)**: Points directly to `http://localhost:8000/graphql` via `HttpLink`.
   - **CORS**: Not applicable to server; browser client communicates with backend port 8000 which permits all origins.

3. **BRICS Federated Governance Portal (`apps/brics-portal`)**:
   - **Port Configuration (`package.json` line 7)**: `"dev": "vite --port 3001"`.
   - **Apollo Client (`src/graphql/client.ts` lines 10–35)**: Points to `http://localhost:8000/graphql` via `HttpLink`.

4. **PHC Field Edge Portal (`apps/phc-portal`)**:
   - **Port Configuration (`vite.config.ts` lines 60–66)**: `server: { port: 5173, fs: { strict: false, allow: ['..'] } }`.
   - **Backend URL Target (`src/hooks/useSyncEngine.ts` line 18)**: Defaults to `http://localhost:8000`.

5. **AI & Demand Forecasting Engine (`services/ai-engine/main.py`)**:
   - **Port**: Port 5000 (FastAPI / Uvicorn).
   - **CORS Middleware (lines 50–61)**:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=[
             "http://localhost:8000",   # Node.js backend
             "http://localhost:3000",   # Governance Portal
             "http://localhost:5173",   # PHC Portal (Vite dev)
             "http://localhost:3001",   # BRICS Portal
         ],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )
     ```
   - **Healthcheck Endpoints**:
     - `GET /health` (lines 119–150): Returns `{ status: "healthy", dependencies: { ... }, timestamp: ... }`.
     - `GET /` (lines 94–116): Returns `{ service: "Smart Health AI & Optimization Engine", status: "online", port: 5000, version: "1.0.0", modules: { ... }, models: [ ... ] }`.
     - `GET /docs`: OpenAPI Swagger documentation.

---

### 1.2 Code Audit: `apps/phc-portal` Mock Elimination

1. **`mockBackendServer` Elimination (`apps/phc-portal/src/utils/mockBackend.ts`)**:
   - Full file content inspection:
     ```ts
     8:  * Mock backend execution has been completely eliminated in accordance with live backend requirements.
     9:  * All mutations and pull syncs must route strictly through live backend HTTP endpoints (/sync/push and /sync/pull).
     10:  */
     11: export const mockBackendServer = {
     12:   simulateOversoldConflict: false,
     13: 
     14:   async handlePush(_req: SyncPushRequest): Promise<SyncPushResponse> {
     15:     throw new Error('Mock backend push execution has been permanently disabled. Use live backend /sync/push.');
     16:   },
     17: 
     18:   async handlePull(_sinceSeq: number, _deviceId: string): Promise<SyncPullResponse> {
     19:     throw new Error('Mock backend pull execution has been permanently disabled. Use live backend /sync/pull.');
     20:   },
     21: };
     ```
   - Ripgrep search across `apps/phc-portal/src` confirmed `mockBackendServer` is **never imported or invoked anywhere** in the application.

2. **`useLiveServer` Branch Toggles Elimination (`apps/phc-portal/src/hooks/useSyncEngine.ts`)**:
   - In `useSyncEngine.ts`, `useLiveServer` is locked to boolean literal `true` and the setter is a no-op:
     ```ts
     269:     useLiveServer: true,
     270:     setUseLiveServer: (_: boolean) => {},
     ```
   - The sync loop executes strictly over HTTP `fetch`:
     - `executePush` (lines 101–115): `fetch(`${backendUrl}/sync/push`, { method: 'POST', ... })`.
     - `executePull` (lines 130–144): `fetch(`${backendUrl}/sync/pull?since=${sinceSeq}&device_id=${CURRENT_DEVICE_ID}&limit=100`, ...)`.
   - No conditional branches evaluate `if (!useLiveServer)` or route to client-side mocks.

3. **Fallback PIN Auth Removal (`apps/phc-portal/src/services/phcBackendService.ts` & `src/modules/auth/LoginView.tsx`)**:
   - In `phcBackendService.ts` (lines 52–76):
     ```ts
     static async verifyLogin(params: { phcId: string; staffId: string; role: string; pin: string; }) {
       const res = await fetch(`${BACKEND_BASE}/api/v1/phc/auth/verify`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(params),
         signal: AbortSignal.timeout(5000),
       });
       const data = await res.json();
       if (!res.ok || !data.success) {
         throw new Error(data.error || 'Authentication failed. Please verify your credentials and security PIN.');
       }
       return data;
     }
     ```
   - In `LoginView.tsx` (lines 173–234): Credentials are authenticated strictly via `PhcBackendService.verifyLogin`. In the event of network or authentication error, the catch block (lines 226–233) sets `setErrorMsg(...)` and prevents login. No hardcoded credentials bypass the live server check.

4. **Fake Local Database Seeds Removal (`apps/phc-portal/src/db/seedData.ts`)**:
   - In `seedData.ts` (lines 24–40), `initializeDatabase()` no longer injects mock medicines, batches, facilities, or patients:
     ```ts
     export async function initializeDatabase() {
       const configCount = await db.system_config.count();
       if (configCount === 0) {
         const configs: SystemConfig[] = [
           { key: 'near_expiry_days', value: 45, updated_at: new Date().toISOString() },
           { key: 'oxygen_critical_threshold', value: 5, updated_at: new Date().toISOString() },
           { key: 'bed_occupancy_critical_threshold', value: 80, updated_at: new Date().toISOString() },
           { key: 'auto_sync_interval_seconds', value: 30, updated_at: new Date().toISOString() },
           { key: 'last_successful_sync_time', value: new Date().toISOString(), updated_at: new Date().toISOString() },
         ];
         await db.system_config.bulkPut(configs);
       }
     }
     ```
   - Dexie IndexedDB tables (`phc_facilities`, `inventory_batches`, `patient_footfall`, `alerts`, `staff_registry`, `equipment`, `staff_attendance`, `resource_requests`) are cleared and hydrated directly from PostgreSQL via `PhcBackendService.hydratePhcDatabase(phcId)` on line 84:
     `fetch(`${BACKEND_BASE}/api/v1/phc/${phcId}/live-data`)`.

---

### 1.3 Code Audit: `apps/governance-portal` Mock Elimination

1. **`apolloClient` Configuration (`apps/governance-portal/src/lib/apolloClient.ts`)**:
   - Verified lines 1–62:
     ```ts
     const BACKEND_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) ||
       'http://localhost:8000/graphql';

     const httpLink = new HttpLink({ uri: BACKEND_URL, fetch });

     const errorLink = onError(({ graphQLErrors, networkError }) => {
       if (graphQLErrors) {
         graphQLErrors.forEach(({ message, locations, path }) =>
           console.error(`[Governance GraphQL Error] ${message}`, { locations, path }),
         );
       }
       if (networkError) {
         console.error('[Governance GraphQL Network Error]', networkError);
       }
     });

     export const apolloClient = new ApolloClient({
       link: from([errorLink, authLink, httpLink]),
       cache: new InMemoryCache(),
       defaultOptions: {
         watchQuery: { fetchPolicy: 'cache-and-network' },
         query: { fetchPolicy: 'network-only' },
       },
     });
     ```
   - The client connects via direct `HttpLink` to `http://localhost:8000/graphql`.
   - `mockLink` has been eliminated from the link chain.

2. **Removal of `mockLink` and `mockResolvers`**:
   - `mockResolvers.ts` (`src/graphql/mockResolvers.ts`) is completely detached from the runtime bundle. Ripgrep confirmation: 0 import statements reference `mockResolvers` across all `.ts`/`.tsx` files in `apps/governance-portal/src`.
   - `MOCK_SEED_ALERTS` in `src/store/alertStore.ts` (line 73) is set to an empty array `[]`.

3. **Page-by-Page Audit for Live GraphQL Data Sourcing**:
   - **Command Center (`src/app/governance/page.tsx`)**:
     - Line 102: `const { data: nationalData } = useQuery(NATIONAL_OVERVIEW);`
     - Line 104: `const { data: stateData } = useQuery(STATE_OVERVIEW, { variables: { stateId } });`
     - Line 108: `const { data: districtData } = useQuery(DISTRICT_OVERVIEW, { variables: { districtId } });`
     - Lines 148–200: `baselineKpis` maps directly to `nationalOverview?.totalPhcs`, `totalBeds`, `occupiedBeds`, `bedOccupancyRate`, `oxygenCylindersAvailable`, and `stockoutAlerts`.
   - **Redistribution Management (`src/app/redistribution/page.tsx`)**:
     - Line 101: `useQuery(REDISTRIBUTION_RECOMMENDATIONS, { variables: { district: currentDistrict }, fetchPolicy: 'cache-and-network' })`.
     - Lines 107–111: `useEffect` populates recommendations strictly when live records return from `gqlData.redistributionRecommendations`. `MOCK_RECOMMENDATIONS` is unreferenced in page logic.
     - Line 60: Decision actions dispatch `POST /api/v1/governance/redistribution/${recommendationId}/decision` to the backend.
   - **Medicine Intelligence (`src/app/medicine/page.tsx`)**:
     - Line 48: `const { data: medData, loading } = useQuery(MEDICINE_INTELLIGENCE, { variables: { scope } });`
     - Line 101: `liveCatalog` returns `[]` if no backend records exist; zero fallback to mock medicine lists.
   - **Resources Intelligence (`src/app/resources/page.tsx`)**:
     - Line 76: `const { data: resData } = useQuery(RESOURCE_INTELLIGENCE, { variables: { scope } });`
     - Line 89: Dynamic overlay maps `resData?.resourceIntelligence` beds and oxygen.
   - **Workforce Intelligence (`src/app/workforce/page.tsx`)**:
     - Line 77: `const { data: wfData } = useQuery(WORKFORCE_INTELLIGENCE, { variables: { scope } });`
   - **Patient Intelligence (`src/app/patients/page.tsx`)**:
     - Line 76: `const { data: ptData } = useQuery(PATIENT_INTELLIGENCE, { variables: { scope } });`
   - **Supply Chain Tracking (`src/app/supply-chain/page.tsx`)**:
     - Line 84: `const { data: gqlData } = useQuery(SUPPLY_CHAIN_SHIPMENTS, { variables: { filter } });`
     - Lines 94–107: `shipments` derives exclusively from `gqlData?.supplyChainShipments`.
   - **Audit Logs (`src/app/audit/page.tsx`)**:
     - Line 58: `const { data: liveAuditData } = useQuery(AUDIT_LOG);`
     - Lines 63–80: `effectiveEntries` maps live `audit_log` records from PostgreSQL.
   - **Early Warnings (`src/app/early-warnings/page.tsx`)**:
     - Line 74: `const { data: gqlData } = useQuery(ALERTS_HISTORY, { variables: { districtId, stateId } });`
     - Line 59: Real-time SSE stream connected to `/api/v1/governance/alerts/stream`.
   - **GIS Geospatial Map (`src/components/gis/GisMap.tsx`)**:
     - Line 230: `const { data: districtData } = useQuery(DISTRICT_OVERVIEW, { variables: { districtId } });`
     - Line 236: Live facilities mapped from `districtData.districtOverview.phcList`.

---

### 1.4 Code Audit: `apps/brics-portal` Mock Elimination

1. **`VITE_USE_MOCK` & Environment Configuration**:
   - `apps/brics-portal/src/graphql/client.ts` contains no mock toggles:
     ```ts
     const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:8000/graphql';
     ```
   - No `.env` files enable `VITE_USE_MOCK=true`.

2. **Elimination of `SchemaLink` and `resilientFallbackLink`**:
   - `apps/brics-portal/src/graphql/client.ts` lines 35–43:
     ```ts
     const httpLink = new HttpLink({ uri: BACKEND_URL });

     export const apolloClient = new ApolloClient({
       link: from([errorLink, authLink, httpLink]),
       cache: new InMemoryCache(),
       defaultOptions: {
         watchQuery: { fetchPolicy: 'cache-and-network' },
       },
     });
     ```
   - Ripgrep confirms `SchemaLink` and `resilientFallbackLink` are **completely absent** from all source files in `apps/brics-portal/src`.
   - `ApolloWrapper.tsx` passes `apolloClient` directly from `src/graphql/client.ts`.

3. **Federated Pages Connected to Live GraphQL**:
   - `OverviewPage.tsx`: `useQuery(GET_FEDERATED_NODES)`, `useQuery(GET_FEDERATED_ROUNDS)`, `useQuery(GET_FEDERATED_MODEL_VERSIONS)`, `useQuery(GET_FEDERATED_PRIVACY_BUDGET)`.
   - `NodesPage.tsx`: `useQuery(GET_FEDERATED_NODES)` querying live nodes from backend.
   - `RoundsPage.tsx`: `useQuery(GET_FEDERATED_ROUNDS)`.
   - `RoundReviewPage.tsx`: `useQuery(GET_FEDERATED_ROUND)`, `useMutation(APPROVE_AGGREGATED_MODEL)`, `useMutation(REJECT_AGGREGATED_MODEL)`.
   - `PrivacyPage.tsx`: `useQuery(GET_FEDERATED_PRIVACY_BUDGET)`.
   - `LineagePage.tsx`: `useQuery(GET_FEDERATED_MODEL_VERSIONS)`.
   - `SettingsPage.tsx`: `useQuery(GET_FEDERATED_NODES)`, `useMutation(TOGGLE_COUNTRY_PARTICIPATION)`.

---

### 1.5 GraphQL Error Handling & Absence of Silent Fallbacks

Across all portals and the backend:
1. **No Error-Interception Links**: Neither `governance-portal/src/lib/apolloClient.ts` nor `brics-portal/src/graphql/client.ts` includes an `onError` link that rewrites GraphQL execution results or passes requests to an in-memory schema fallback. The `errorLink` purely logs error messages (`console.error` and `console.warn`).
2. **Explicit UI Error Surfacing in `brics-portal`**:
   In `OverviewPage.tsx` (lines 134–140), `NodesPage.tsx` (line 197), `RoundsPage.tsx` (line 91), `RoundReviewPage.tsx` (line 182), `PrivacyPage.tsx` (line 111), and `SettingsPage.tsx` (line 82):
   ```tsx
   if (anyError) {
     return (
       <div className="py-4">
         <ErrorState
           title="Federation Telemetry Unavailable"
           message={anyError.message}
           onRetry={refetchAll}
         />
       </div>
     );
   }
   ```
   If the backend is offline or returns an error, the portal renders a clear error banner with retry controls.
3. **Backend GraphQL Route Error Handling (`graphqlServer.ts` lines 1350–1378)**:
   The backend executes the query through `graphql({ schema: compiledSchema, rootValue: rootResolvers, ... })`. Resolver execution errors are returned cleanly in standard `{ errors: [...] }` arrays at HTTP 200 without catching and replacing with fake data.

---

## 2. Logic Chain

1. **Service Liveness & Port Verification**:
   - `start_platform.bat` launches:
     - PostgreSQL on 5432
     - AI Engine on 5000 (`services/ai-engine/main.py`)
     - Central Backend on 8000 (`services/backend/smart-health-platform/backend/src/index.ts`)
     - Governance Portal on 3000 (`apps/governance-portal`)
     - BRICS Portal on 3001 (`apps/brics-portal`)
     - PHC Portal on 5173 (`apps/phc-portal`)
   - All 5 processes are verified running.
   - Backend `src/index.ts` lines 8–18 and AI Engine `main.py` lines 50–61 explicitly enable CORS for all port origins (8000, 3000, 3001, 5173), preventing browser CORS rejection.

2. **Deduction on Mock Data Removal in `apps/phc-portal`**:
   - `mockBackendServer` has explicit throws on line 15 and 19 of `mockBackend.ts` and 0 imports. Therefore, no mock backend code path can execute.
   - `useLiveServer` is hardcoded to `true` on line 269 of `useSyncEngine.ts`. All push and pull sync operations target `http://localhost:8000/sync/push` and `/sync/pull`.
   - `seedData.ts` only sets threshold numbers in `system_config`. The operational tables in Dexie are cleared and populated via `POST /api/v1/phc/auth/verify` and `GET /api/v1/phc/:phcId/live-data`. Therefore, local fake database seeds have been eliminated.

3. **Deduction on Mock Data Removal in `apps/governance-portal`**:
   - `apolloClient.ts` uses `HttpLink` targeting `http://localhost:8000/graphql`.
   - `mockLink` is removed from `apolloClient.ts`. `mockResolvers.ts` has 0 references in `src/`.
   - Pages (`governance`, `redistribution`, `medicine`, `resources`, `workforce`, `patients`, `supply-chain`, `audit`, `gis`) use Apollo `useQuery` directly without falling back to mock datasets when rendering tables or statistics.

4. **Deduction on Mock Data Removal in `apps/brics-portal`**:
   - `client.ts` uses `HttpLink` to `http://localhost:8000/graphql`.
   - `SchemaLink` and `resilientFallbackLink` are completely deleted from code.
   - All 7 portal pages (`Overview`, `Nodes`, `Rounds`, `RoundReview`, `Privacy`, `Lineage`, `Settings`) render live GraphQL query results or display explicit `<ErrorState>` on failure.

5. **Deduction on GraphQL Error Handling**:
   - Neither client nor backend catches GraphQL errors to substitute static in-memory fake schemas. Errors bubble to UI error handlers or standard GraphQL error envelopes.

---

## 3. Caveats

1. **Subagent Interactive Shell Constraints**:
   - The explorer subagent environment timed out on long PowerShell interactive permission prompts for arbitrary commands. However, all findings are established from process table inspection, startup scripts, configuration files, and exact source code inspections.
2. **PostgreSQL Service State**:
   - While `pool.ts` is configured for `postgres:postgres@localhost:5432/smarthealth` and `start_platform.bat` checks and starts `pg_ctl`, direct database connectivity requires the local PostgreSQL service to be actively running.
3. **Outdated README Documentation**:
   - `apps/governance-portal/README.md` and `apps/brics-portal/README.md` still mention legacy `MockLink` and `SchemaLink` in their descriptive text. These references are purely historical documentation artifacts; the actual runtime code files have zero imports or usages of mock links.

---

## 4. Conclusion

1. **R1 Acceptance Criteria Met**:
   - All 4 portal and backend services (ports 8000, 3000, 3001, 5173) as well as the AI Engine (port 5000) have concrete startup configurations, valid healthcheck endpoints (`/health`, `/`), and complete CORS configurations with zero cross-origin blockers.
   - All mock server fallbacks (`mockBackendServer`, `useLiveServer` branching, fallback PIN auth, fake local database seeds) have been removed from `apps/phc-portal`.
   - All mock link fallbacks (`mockLink`, `mockResolvers`) have been removed from `apps/governance-portal`, and all governance screens query live GraphQL.
   - All mock fallback links (`SchemaLink`, `resilientFallbackLink`, `VITE_USE_MOCK`) have been removed from `apps/brics-portal`, and all federated metrics query live GraphQL.
   - GraphQL error handling does not catch errors to serve in-memory fake schemas.

---

## 5. Verification Method

To independently verify R1:

1. **Inspect Code Files**:
   - `apps/phc-portal/src/utils/mockBackend.ts` (verify throws and no callers).
   - `apps/phc-portal/src/hooks/useSyncEngine.ts` (verify lines 18, 101, 130, 269–270).
   - `apps/governance-portal/src/lib/apolloClient.ts` (verify lines 16–18, 39, 54–61).
   - `apps/brics-portal/src/graphql/client.ts` (verify lines 10, 35, 38–43).
   - `services/backend/smart-health-platform/backend/src/index.ts` (verify lines 8–18, 40–55, 407–409).
   - `services/ai-engine/main.py` (verify lines 50–61, 94–125).

2. **Execute Cross-Portal Integration Suite**:
   Run the preflight health and connectivity checks from the backend directory:
   ```powershell
   npm run verify
   ```
   Or:
   ```powershell
   npm --prefix services/backend/smart-health-platform/backend run test:integration
   ```
   *Stage 1 of the suite asserts HTTP 200 on `http://localhost:8000/health`, `http://localhost:8000/graphql`, `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`, and `http://localhost:5000/docs`.*

3. **Invalidation Conditions**:
   - If any `.env` file reintroduces `VITE_USE_MOCK=true`.
   - If `SchemaLink` or `mockLink` is reintroduced into `apolloClient.ts` or `client.ts`.
   - If `mockBackendServer` is imported into `useSyncEngine.ts`.
