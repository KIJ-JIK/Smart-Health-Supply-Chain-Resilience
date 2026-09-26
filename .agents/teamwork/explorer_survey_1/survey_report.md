# Cross-Portal Mock Data, Fake Schema & Fallback Infrastructure Survey Report

**Date**: 2026-09-26  
**Auditor**: Explorer 1 (Role: Codebase & Portal Mock Investigator)  
**Workspace**: `C:\Users\anshv\OneDrive\Desktop\Smart_governance`  
**Runtime Synchronization Target**: `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`  
**Reference Document**: `ORIGINAL_REQUEST.md`

---

## 1. Executive Summary

A comprehensive architectural and forensic code investigation was performed across all three frontend applications in the Smart Health Platform:
1. `apps/phc-portal` (Vite + React + TypeScript + Dexie IndexedDB)
2. `apps/governance-portal` (Next.js 14 App Router + Apollo Client + Zustand)
3. `apps/brics-portal` (Vite + React + Apollo Client + SchemaLink + Zustand)

### Key Discoveries at a Glance:
- **`apps/phc-portal`**: While primary views bind to a local Dexie IndexedDB database that supports live hydration from PostgreSQL (`/api/v1/phc/:phcId/live-data`), the sync mechanism contains a dual-branch engine. `src/utils/mockBackend.ts` provides a simulated in-browser server that intercepts pushes and pulls when `useLiveServer` is toggled off or in error states. `SyncStatusView.tsx` exposes UI controls to force in-browser simulation and inject artificial stockout conflicts (`simulateOversoldConflict`). Furthermore, `src/services/phcBackendService.ts` contains hardcoded fallback facility records (`FALLBACK_FACILITIES`), fallback staff arrays, and an offline PIN verification fallback (`clinic@2026` / any non-empty PIN) that issues fake JWT access tokens (`offline-jwt-token-access`).
- **`apps/governance-portal`**: The GraphQL client (`src/lib/apolloClient.ts`) retains a complete `mockLink` constructed with `mockResolvers.ts`, capable of synthesizing randomized metrics for all 12 root queries. More critically, **8 major operational pages completely bypass GraphQL queries altogether** and render hardcoded static TypeScript datasets located in `src/lib/*Data.ts` (`medicineData.ts`, `resourceData.ts`, `workforceData.ts`, `patientData.ts`, `forecastData.ts`, `auditData.ts`, `analyticsData.ts`, `gisData.ts`, `syncMonitoringData.ts`). Even the main National Command Center overview (`src/app/governance/page.tsx`) contains hardcoded fallback numbers, hardcoded sparklines, static meters, and hardcoded district tables that do not reflect database changes.
- **`apps/brics-portal`**: The portal is explicitly forced into mock mode via `apps/brics-portal/.env` (`VITE_USE_MOCK=true`). In `src/graphql/client.ts`, an in-memory executable schema (`SchemaLink`) wraps `src/graphql/schema.ts` and `src/graphql/resolvers.ts`, which push directly to in-memory arrays (`mockNodes`, `mockRounds`, `mockModelVersions`, `mockPrivacyBudget`). Even if live connection is attempted, a custom `resilientFallbackLink` intercepts any network or GraphQL error and seamlessly routes the operation to the mock schema. In addition, `src/pages/NodesPage.tsx` imports mock node detail records directly from `src/graphql/mock-node-details.ts` and hardcoded country stats (`COUNTRY_STATS`). Significant GraphQL schema and operation field mismatches exist between `brics-portal` and the backend `graphqlServer.ts`.
- **Backend Readiness**: The Express + GraphQL backend at `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts` already contains real PostgreSQL pool queries for `nationalOverview`, `stateOverview`, `districtOverview`, `phcDetail`, `medicineIntelligence`, `resourceIntelligence`, `workforceIntelligence`, `patientIntelligence`, `forecasts`, `redistributionRecommendations`, `supplyChainShipments`, `auditLog`, `alertsHistory`, and federation tables. The sync controller (`/sync/push` and `/sync/pull`) and facility routes (`/api/v1/phc/*`) are fully functional with PostgreSQL table updates.

Removing these mock layers requires eliminating client-side fallback schemas, deactivating mock links, replacing static `@/lib/*Data.ts` dataset imports with live Apollo/REST hooks, harmonizing GraphQL operation schemas, and enforcing real PostgreSQL JWT authentication across all three tiers.

---

## 2. Deep-Dive: `apps/phc-portal`

### 2.1 Architecture Overview
The PHC Portal is built as an offline-first Single Page Application. It uses a Dexie IndexedDB database (`PHCDatabase` in `src/db/index.ts`) as its operational store. All modules query Dexie reactively using `useLiveQuery` from `dexie-react-hooks`.
When actions occur, modules invoke `useMutationQueue().enqueue(entityType, payload)`. Mutations are queued locally in `db.mutation_queue` and synced via `useSyncEngine`.
The portal is designed to be hydrated from the backend upon login via `PhcBackendService.hydratePhcDatabase(phcId)`.

However, multiple fallback and mock structures exist that allow the portal to function completely disconnected from PostgreSQL.

### 2.2 In-Memory Mock Backend Server (`src/utils/mockBackend.ts`)
- **File Path**: `apps/phc-portal/src/utils/mockBackend.ts`
- **Lines**: 1–101
- **Exact Code Mechanism**:
```typescript
// apps/phc-portal/src/utils/mockBackend.ts
let currentServerSeq = 100;
const processedMutationIds = new Set<string>();

export const mockBackendServer = {
  simulateOversoldConflict: false,

  async handlePush(req: SyncPushRequest): Promise<SyncPushResponse> {
    await new Promise((res) => setTimeout(res, 400));
    const results: SyncMutationResult[] = [];

    for (const m of req.mutations) {
      if (processedMutationIds.has(m.id)) {
        results.push({ mutation_id: m.id, status: 'duplicate', server_entity_id: m.id });
        continue;
      }
      if (this.simulateOversoldConflict && m.entity_type === 'billing_transaction') {
        const reqQty = m.payload?.items?.[0]?.quantity || 10;
        const availQty = Math.max(1, Math.floor(reqQty / 2));
        results.push({
          mutation_id: m.id,
          status: 'conflict',
          error_code: 'STOCK_OVERSOLD',
          conflict: { ... }
        });
        continue;
      }
      processedMutationIds.add(m.id);
      currentServerSeq++;
      results.push({ mutation_id: m.id, status: 'accepted', server_entity_id: m.id });
    }
    return { server_seq: currentServerSeq, results };
  },

  async handlePull(sinceSeq: number, deviceId: string): Promise<SyncPullResponse> {
    ...
  }
};
```
- **Finding**: This object mimics a live sync backend in RAM. It maintains a fake sequence counter starting at 100 and simulates network latency with `setTimeout`.

### 2.3 Dual-Route Push/Pull Branching (`src/hooks/useSyncEngine.ts`)
- **File Path**: `apps/phc-portal/src/hooks/useSyncEngine.ts`
- **Lines**: 19, 93–121, 127–154, 279–280
- **Exact Code Mechanism**:
```typescript
// Line 19:
const [useLiveServer, setUseLiveServer] = useState(true);

// Lines 93-121 (executePush):
if (useLiveServer) {
  const resp = await fetch(`${backendUrl}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      'X-Device-ID': CURRENT_DEVICE_ID,
      'X-PHC-ID': getCurrentPhcId(),
    },
    body: JSON.stringify(reqBody),
  });
  if (!resp.ok) throw new Error(...);
  return await resp.json();
} else {
  return await mockBackendServer.handlePush(reqBody);
}

// Lines 127-154 (executePull):
if (useLiveServer) {
  const resp = await fetch(`${backendUrl}/sync/pull?since=${sinceSeq}&device_id=${CURRENT_DEVICE_ID}&limit=100`, ...);
  if (!resp.ok) throw new Error(...);
  return await resp.json();
} else {
  return await mockBackendServer.handlePull(sinceSeq, CURRENT_DEVICE_ID);
}
```
- **Finding**: If `useLiveServer` is `false`, mutations are never transmitted to PostgreSQL. They are consumed by `mockBackendServer` and marked as `synced` in Dexie, giving the false illusion of synchronization.

### 2.4 Simulator Controls in UI (`src/modules/sync/SyncStatusView.tsx`)
- **File Path**: `apps/phc-portal/src/modules/sync/SyncStatusView.tsx`
- **Lines**: 23, 27–38, 260–298, 300–320
- **Exact Code Mechanism**:
```tsx
// Lines 264-285:
<label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
  <input
    type="radio"
    name="syncMode"
    checked={!useLiveServer}
    onChange={() => setUseLiveServer(false)}
    className="text-primary-600"
  />
  <span>Simulated In-Browser Engine</span>
</label>

<label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
  <input
    type="radio"
    name="syncMode"
    checked={useLiveServer}
    onChange={() => setUseLiveServer(true)}
    className="text-primary-600"
  />
  <span>Live Backend HTTP Server</span>
</label>

// Lines 301-315:
<button onClick={toggleConflictSimulation} ...>
  Inject STOCK_OVERSOLD conflict response on next push
</button>
```
- **Finding**: The UI provides a manual switch to detach the frontend from the live backend and enable synthetic in-memory conflict generation.

### 2.5 Offline Fallbacks in `PhcBackendService` (`src/services/phcBackendService.ts`)
- **File Path**: `apps/phc-portal/src/services/phcBackendService.ts`
- **Lines**: 22–35, 45–57, 62–79, 84–134, 346–375
- **Exact Code Mechanism**:
  1. **Hardcoded Facilities Array (`FALLBACK_FACILITIES`)**: Lines 22–35 contain 12 hardcoded facilities (e.g., `'c0000003-0000-0000-0000-000000000001'` Kothrud PHC, `'91e182b8-8655-475a-a723-e8b35d91580f'` PHC Uttar Pradesh West 1).
  2. **`fetchFacilities()` Catch Block**: Lines 53–56:
     ```typescript
     catch (err) {
       console.warn('[PhcBackendService] Backend unreachable at port 8000, using offline baseline facilities.');
       return FALLBACK_FACILITIES;
     }
     ```
  3. **`fetchStaffList()` Catch Block**: Lines 68–70 falls back to `getDefaultStaff()` returning 3 hardcoded staff (`staff-mo-01` Dr. Rajesh Sharma, `staff-ph-01` Priya Patel, `staff-nr-01` Sister Anjali Verma).
  4. **`verifyLogin()` Offline Credential Bypass**: Lines 113–132:
     ```typescript
     // If backend is offline or network fails, permit offline clinic login with default PIN
     if (params.pin === 'clinic@2026' || params.pin.trim().length > 0) {
       console.warn('[PhcBackendService] Backend offline, authenticating in offline resilience mode');
       const facs = await this.fetchFacilities();
       const facility = facs.find(f => f.id === params.phcId) || facs[0];
       return {
         success: true,
         tokens: {
           accessToken: 'offline-jwt-token-access',
           refreshToken: 'offline-jwt-token-refresh',
         },
         staff: { ... },
         facility,
       };
     }
     ```
     *Impact*: Generates a dummy JWT token string `offline-jwt-token-access`. When the sync engine attempts to call the real backend with this token, `requireAuth` in the backend rejects it with 401 Unauthorized, forcing the user to stay in mock mode.
  5. **`hydratePhcDatabase()` Fallback**: Lines 346–375: If `GET ${BACKEND_BASE}/api/v1/phc/${phcId}/live-data` fails, it populates Dexie with `FALLBACK_FACILITIES[0]` and returns `{ facility: fac, offline: true }` instead of bubbling the error.

### 2.6 PHC Portal Component Dependency Matrix
All module views in `src/modules/` query Dexie tables. Their reliance on mock data depends entirely on whether `PhcBackendService.hydratePhcDatabase()` loaded live data or fallback data, and whether `useSyncEngine` pushed mutations to PostgreSQL or `mockBackendServer`.

| Module File | Dexie Table Queried | Mutation Enqueued | Mock Data Risk |
|---|---|---|---|
| `modules/dashboard/DashboardView.tsx` | `phc_facilities`, `patient_footfall`, `alerts`, `inventory_batches`, `equipment` | None (Read only) | Shows stale or fallback data if DB hydrated from fallback. |
| `modules/beds/BedsView.tsx` | `phc_facilities`, `patient_footfall` | `facility_update` | If `useLiveServer=false`, updates never reach PostgreSQL. |
| `modules/inventory/InventoryView.tsx` | `medicines`, `inventory_batches`, `stock_movements`, `billing_transactions`, `system_config` | `inventory_batch_update` | If `useLiveServer=false`, stock adjustments stay local. |
| `modules/billing/BillingView.tsx` | `medicines`, `inventory_batches`, `staff_registry`, `billing_transactions`, `dispensed_items` | `billing_transaction` | If `useLiveServer=false`, billing records are swallowed by `mockBackendServer`. |
| `modules/oxygen/OxygenView.tsx` | `phc_facilities`, `system_config` | `facility_update` | Enqueues `facility_update` (total/available cylinders). |
| `modules/requests/RequestsView.tsx` | `resource_requests`, `medicines` | `resource_request` | Enqueues resource requests. |
| `modules/alerts/AlertsView.tsx` | `alerts` | Local Dexie update (`status='resolved'`) | Updates stay in local Dexie unless synced. |
| `modules/emergency/EmergencyModal.tsx` | None | `alert_report` | Enqueues high-severity outbreak/emergency alert. |
| `modules/footfall/FootfallView.tsx` | `patient_footfall`, `phc_facilities` | None (Local view) | Reflects Dexie footfall table. |
| `modules/staff/StaffView.tsx` | `staff_registry`, `staff_attendance` | `staff_attendance` | Enqueues attendance mark. |
| `modules/equipment/EquipmentView.tsx` | `equipment` | None | Read-only Dexie query. |
| `modules/sync/SyncStatusView.tsx` | `mutation_queue` | `billing_transaction` (on partial resolution) | **Direct mock UI**: toggles `useLiveServer` & `simulateOversoldConflict`. |

---

## 3. Deep-Dive: `apps/governance-portal`

### 3.1 Architecture Overview
The Governance Portal is built on Next.js 14 App Router. Apollo Client (`src/lib/apolloClient.ts`) is configured to query `http://localhost:8000/graphql`.
However, the portal exhibits a severe split in implementation:
1. Apollo Client is equipped with `mockResolvers` and a `mockLink` fallback.
2. Even more significantly, **most pages do not use Apollo Client or GraphQL queries at all**; instead, they directly import hardcoded TypeScript data files from `src/lib/*Data.ts`.
3. In `app/governance/page.tsx`, where `useQuery` is used, baseline KPIs fall back to hardcoded numbers, and all four major operational dashboard panels contain static tables, meters, and forecast arrays.

### 3.2 Apollo Client Mock Link (`src/lib/apolloClient.ts`)
- **File Path**: `apps/governance-portal/src/lib/apolloClient.ts`
- **Lines**: 18–31, 73–111, 115–125
- **Exact Code Mechanism**:
```typescript
// Lines 75-88:
const mockResolvers: Record<string, (variables: any) => unknown> = {
  nationalOverview: () => mockNationalOverview(),
  stateOverview: ({ stateId }: { stateId: string }) => mockStateOverview(stateId),
  districtOverview: ({ districtId }: { districtId: string }) => mockDistrictOverview(districtId),
  phcDetail: ({ phcId }: { phcId: string }) => mockPhcDetail(phcId),
  medicineIntelligence: () => mockMedicineIntelligence(),
  resourceIntelligence: () => mockResourceIntelligence(),
  workforceIntelligence: () => mockWorkforceIntelligence(),
  patientIntelligence: () => mockPatientIntelligence(),
  forecasts: (vars: { metric?: string }) => mockForecasts(vars?.metric ?? 'stockDays'),
  redistributionRecommendations: () => mockRedistributionRecommendations(),
  supplyChainShipments: () => mockSupplyChainShipments(),
  auditLog: () => mockAuditLog(),
};

// Lines 90-111:
export const mockLink = new ApolloLink((operation) => {
  return new Observable<FetchResult>((observer) => {
    const { query, variables } = operation;
    const printed = print(query);
    const selectionMatch = printed.match(/\b(\w+)\s*[({]/g);
    const data: Record<string, unknown> = {};
    if (selectionMatch) {
      for (const sel of selectionMatch) {
        const field = sel.replace(/[\s({]/g, '');
        if (mockResolvers[field]) {
          data[field] = mockResolvers[field](variables as any);
        }
      }
    }
    const timer = setTimeout(() => {
      observer.next({ data });
      observer.complete();
    }, 200 + Math.random() * 300);
    return () => clearTimeout(timer);
  });
});

// Lines 115-125:
const useMock =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_MOCK === 'true';

export const apolloClient = new ApolloClient({
  link: useMock ? mockLink : from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  ...
});
```

### 3.3 Synthetic Mock Resolvers (`src/graphql/mockResolvers.ts`)
- **File Path**: `apps/governance-portal/src/graphql/mockResolvers.ts`
- **Lines**: 1–290
- **Functions Defined**:
  - `mockNationalOverview()` (Lines 31–46): Generates `totalPhcs: 45_320`, `activePhcs: 44_108`, `stockoutAlerts: 234`, `criticalShortages: 78`.
  - `mockStateOverview(stateId)` (Lines 49–62): Generates `totalPhcs: 3_682`, `activePhcs: 3_601`, random alerts with `rand(10, 40)`.
  - `mockDistrictOverview(districtId)` (Lines 65–78): Generates `totalPhcs: 148`, `activePhcs: 145`, random alerts with `rand(1, 8)`.
  - `mockPhcDetail(phcId)` (Lines 81–94): Hardcoded Hadapsar PHC with population 28,000, 23 staff.
  - `mockMedicineIntelligence()` (Lines 104–126): Maps 14 hardcoded medicine strings with randomized stock `rand(0, 5000)`.
  - `mockResourceIntelligence()` (Lines 138–153): Maps 6 hardcoded resource types with `rand(100, 1000)`.
  - `mockWorkforceIntelligence()` (Lines 161–177): Maps 7 roles with `rand(50, 500)` sanctioned.
  - `mockPatientIntelligence()` (Lines 180–188): Generates random visits `rand(80_000, 200_000)`.
  - `mockForecasts(metric)` (Lines 191–208): Generates 12 randomized weekly points using `rand(1000, 5000)`.
  - `mockRedistributionRecommendations()` (Lines 216–236): Generates 8 synthetic recommendations.
  - `mockSupplyChainShipments()` (Lines 244–266): Generates 10 synthetic shipment items.
  - `mockAuditLog()` (Lines 277–290): Generates 20 fake audit entries with fake IPs and names.

### 3.4 Complete Audit of Static Datasets (`src/lib/*Data.ts`) & Page Bypasses
The following table provides the forensic mapping of which pages bypass live GraphQL queries in favor of local static TypeScript datasets:

| File Path in `src/lib/` | Size | Imported By Component / Page | Actual Page Behavior & Mock Evidence |
|---|---|---|---|
| `src/lib/medicineData.ts` | 27,968 B | `src/app/medicine/page.tsx:8`, `src/components/medicine/MedicineDetailModal.tsx:8` | **Completely ignores GraphQL query `MEDICINE_INTELLIGENCE`**. Line 54: `MEDICINE_CATALOG.filter(...)`. Shows 24 static medicines with fixed batch numbers, static batches, and client-calculated mock coverage days. |
| `src/lib/resourceData.ts` | 16,275 B | `src/app/resources/page.tsx:12-23` | **Completely ignores GraphQL query `RESOURCE_INTELLIGENCE`**. Directly renders `getBedDataByScope()`, `getOxygenDataByScope()`, `getEquipmentDataByScope()`. Bed occupancy rates and cylinder counts are hardcoded numbers. |
| `src/lib/workforceData.ts` | 16,715 B | `src/app/workforce/page.tsx:11-20` | **Completely ignores GraphQL query `WORKFORCE_INTELLIGENCE`**. Directly renders `getWorkforceSummaryByScope()`, `getRoleBreakdownByScope()`, `getDistrictStaffingComparison()`. Staffing figures are computed from static arrays. |
| `src/lib/patientData.ts` | 14,547 B | `src/app/patients/page.tsx:12-22` | **Completely ignores GraphQL query `PATIENT_INTELLIGENCE`**. Directly renders `getPatientSummaryByScope()`, `getPatientFlowTrendsByScope()`, `getSurgeAnomaliesByScope()`. OPD and inpatient visit counts are static mocks. |
| `src/lib/forecastData.ts` | 16,719 B | `src/app/forecasts/page.tsx:10-14` | **Completely ignores GraphQL query `FORECASTS`**. Directly renders `getForecastCardsByScope(level, selectedCategory)`. All forecast horizons, confidence bounds, and curves are static data. |
| `src/lib/auditData.ts` | 14,743 B | `src/app/audit/page.tsx:3`, `src/store/auditStore.ts:9` | **Completely ignores GraphQL query `AUDIT_LOG`**. `useAuditStore` initializes its Zustand state directly from `INITIAL_AUDIT_LOG` (stored in localStorage key `'governance_audit_log_v1'`). Never queries the PostgreSQL `audit_log` table. |
| `src/lib/analyticsData.ts` | 7,665 B | `src/app/analytics/page.tsx:10-15` | Directly renders `REPORT_TIERS` and `INITIAL_GENERATED_REPORTS`. Generated reports list is static mock data. |
| `src/lib/gisData.ts` | 21,333 B | `src/app/gis/page.tsx`, `src/components/gis/GisMap.tsx:13-19` | Directly renders `GIS_PHCS` (hardcoded list of 16 PHCs with static coordinates, population, and bed counts) and `GIS_SUPPLY_ROUTES`. Does not query live PHC facilities from PostgreSQL. |
| `src/lib/syncMonitoringData.ts` | 14,202 B | `src/components/admin/SyncMonitoringView.tsx:8`, `src/store/syncMonitoringStore.ts:11-13` | Directly renders `INITIAL_PHC_SYNC_TELEMETRY` and `INITIAL_MUTATION_QUEUE`. Telemetry and mutation queue in admin are in-memory mocks. |
| `src/lib/supplyChainData.ts` | 10,647 B | `src/app/supply-chain/page.tsx:12-17` | `SupplyChainPage` queries `SUPPLY_CHAIN_SHIPMENTS` GraphQL, but imports `MOCK_SHIPMENTS`, `CHAIN_STAGES`, `SUPPLIER_PERFORMANCE_DATA`, `STAGE_BOTTLENECKS`, and `DELAY_REASONS_DISTRIBUTION` for analytics. |
| `src/lib/redistributionData.ts` | 7,968 B | `src/app/redistribution/page.tsx:12-14` | Page queries `REDISTRIBUTION_RECOMMENDATIONS` GraphQL, but retains `MOCK_RECOMMENDATIONS` and fallback handlers in `lib/redistributionData.ts`. |

### 3.5 Hardcoded Elements in National Command Center (`src/app/governance/page.tsx`)
Even though `app/governance/page.tsx` executes `useQuery(NATIONAL_OVERVIEW)`, `useQuery(STATE_OVERVIEW)`, and `useQuery(DISTRICT_OVERVIEW)`, large portions of the UI are hardcoded:
1. **Fallback Baseline KPI Values (Lines 124–167)**:
   ```typescript
   if (isNationalScope) {
     return {
       totalPhcs: nationalOverview?.totalPhcs ?? 45320,
       activePhcs: nationalOverview?.activePhcs ?? 44108,
       criticalPhcs: nationalOverview?.criticalShortages ?? 78,
       medicineAlerts: nationalOverview?.stockoutAlerts ?? 234,
       bedUtilization: 74.2,      // HARDCODED
       oxygenStatus: 96.8,        // HARDCODED
       staffAvailability: 85.8,   // HARDCODED
       patientLoad: 312400,       // HARDCODED
       openEmergencies: nationalOverview?.outbreakAlerts ?? 12,
       pendingRequests: nationalOverview?.pendingRedistributions ?? 156,
     };
   }
   if (isStateScope) {
     return {
       totalPhcs: stateOverview?.totalPhcs ?? 3682,
       activePhcs: stateOverview?.activePhcs ?? 3601,
       criticalPhcs: stateOverview?.criticalShortages ?? 12,
       medicineAlerts: stateOverview?.stockoutAlerts ?? 32,
       bedUtilization: 78.5,      // HARDCODED
       oxygenStatus: 95.1,        // HARDCODED
       staffAvailability: 83.3,   // HARDCODED
       patientLoad: 24800,        // HARDCODED
       openEmergencies: 3,        // HARDCODED
       pendingRequests: 24,       // HARDCODED
     };
   }
   // District fallback
   return {
     totalPhcs: districtOverview?.totalPhcs ?? 148,
     activePhcs: districtOverview?.activePhcs ?? 145,
     criticalPhcs: 3,             // HARDCODED
     medicineAlerts: districtOverview?.stockoutAlerts ?? 6,
     bedUtilization: 81.2,        // HARDCODED
     oxygenStatus: 98.4,          // HARDCODED
     staffAvailability: 88.7,     // HARDCODED
     patientLoad: 1420,           // HARDCODED
     openEmergencies: 1,          // HARDCODED
     pendingRequests: 5,          // HARDCODED
   };
   ```
2. **Hardcoded Sparkline Arrays**:
   - Total PHCs (Line 303): `[45000, 45100, 45200, 45250, 45300, 45310, 45320]`
   - Active PHCs (Line 320): `[43800, 43900, 44020, 44080, 44100, 44095, 44108]`
   - Critical PHCs (Line 338): `[92, 88, 85, 82, 80, 79, 78]`
   - Medicine Alerts (Line 355): `[260, 252, 248, 241, 238, 236, 234]`
   - Bed Utilization (Line 372): `[71, 72, 73, 73.5, 74, 74.1, 74.2]`
   - Pending Requests (Line 457): `[184, 176, 169, 164, 161, 158, 156]`
3. **Panel 1: "What is happening?" (Lines 516–548)**:
   - Meter 1: Essential Medicine Stock Adequacy hardcoded to `87.4%`
   - Meter 2: Cold-Chain Equipment hardcoded to `98.2% Optimal Temp`
   - Meter 3: Emergency Rapid Dispatch Readiness hardcoded to `82.5% Ready`
   - Text descriptions (Pediatric Antibiotic Deficit, Vector Surge) are hardcoded static JSX strings.
4. **Panel 2: "Where is it happening?" (Lines 681–731)**:
   - Table rows are hardcoded to 5 static district items:
     - Rank 1: Pune District (`score: 84`, `phcs: '148 PHCs'`)
     - Rank 2: Gadchiroli Tribal (`score: 79`, `phcs: '64 PHCs'`)
     - Rank 3: Varanasi Urban (`score: 72`, `phcs: '95 PHCs'`)
     - Rank 4: Thane Coastal (`score: 68`, `phcs: '135 PHCs'`)
     - Rank 5: Coimbatore Rural (`score: 61`, `phcs: '98 PHCs'`)
   - It does not query real district aggregates from `stateOverview.districts`.
5. **Panel 3: "What will happen next?" (Lines 64–71, 875–895)**:
   - Renders `FORECAST_CURVE`:
     ```typescript
     const FORECAST_CURVE = [
       { day: 'Day 1 (Today)', baselineCoverage: 87.4, projectedStockout: 78, patientSurge: 0 },
       { day: 'Day 3', baselineCoverage: 86.1, projectedStockout: 84, patientSurge: 4.2 },
       { day: 'Day 5', baselineCoverage: 84.8, projectedStockout: 91, patientSurge: 8.7 },
       { day: 'Day 7', baselineCoverage: 83.2, projectedStockout: 96, patientSurge: 14.8 },
       { day: 'Day 10', baselineCoverage: 81.9, projectedStockout: 104, patientSurge: 17.5 },
       { day: 'Day 14', baselineCoverage: 80.5, projectedStockout: 112, patientSurge: 19.1 },
     ];
     ```
6. **Panel 4: "What should we do?" (Lines 1015–1150)**:
   - Recommendations (Amoxicillin 500mg Mumbai -> Hadapsar, ORS Nashik -> Shirur) and Emergency Escalations (Dengue #EMG-MH-04) are static JSX cards, completely disconnected from `redistributionRecommendations` query results.

### 3.6 In-Memory Stores
- `src/store/alertStore.ts` (Lines 73, 80): Initializes with `MOCK_SEED_ALERTS: Alert[] = []`.
- `src/store/auditStore.ts` (Lines 9, 20): Populated from `INITIAL_AUDIT_LOG` in `src/lib/auditData.ts`.
- `src/store/syncMonitoringStore.ts` (Lines 11–13, 35–36): Populated from `INITIAL_PHC_SYNC_TELEMETRY` and `INITIAL_MUTATION_QUEUE` in `src/lib/syncMonitoringData.ts`.

---

## 4. Deep-Dive: `apps/brics-portal`

### 4.1 Architecture Overview
The BRICS Portal monitors federated learning rounds, model lineage, privacy budget consumption, and cross-border node statuses across Brazil, Russia, India, China, and South Africa.
It uses Vite React + Apollo Client + React Router.

### 4.2 Environment Configuration Forcing Mocks (`apps/brics-portal/.env`)
- **File Path**: `apps/brics-portal/.env`
- **Lines**: 1–2
- **Exact Content**:
```env
VITE_USE_MOCK=true
VITE_BACKEND_URL=http://localhost:8000/graphql
```
- **Finding**: Line 1 explicitly sets `VITE_USE_MOCK=true`. Because of this flag, the Apollo Client in `src/graphql/client.ts` unconditionally selects `mockLink` on initial load.

### 4.3 Apollo Client Mock Schema & Resilient Error Fallback (`src/graphql/client.ts`)
- **File Path**: `apps/brics-portal/src/graphql/client.ts`
- **Lines**: 16–48, 72–78
- **Exact Code Mechanism**:
```typescript
// Line 16-18: Executable mock schema for offline/standalone development
const mockSchema = makeExecutableSchema({ typeDefs, resolvers });
const mockLink = new SchemaLink({ schema: mockSchema });

// Line 21: Force mock check
const forceMock = import.meta.env?.VITE_USE_MOCK === 'true';

// Lines 24-48: Resilient fallback link intercepts network errors and falls back to mockLink
const resilientFallbackLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let sub: any;
    try {
      sub = forward(operation).subscribe({
        next: (result) => {
          if (result.errors && result.errors.length > 0 && !result.data) {
            console.warn('[BRICS GQL] Network returned GraphQL errors with no data, falling back to mock schema');
            mockLink.request(operation)?.subscribe(observer);
          } else {
            observer.next(result);
          }
        },
        error: (networkErr) => {
          console.warn('[BRICS GQL] Backend unavailable, gracefully falling back to mock schema:', networkErr.message);
          mockLink.request(operation)?.subscribe(observer);
        },
        complete: () => observer.complete(),
      });
    } catch (err) {
      mockLink.request(operation)?.subscribe(observer);
    }
    return () => sub?.unsubscribe();
  });
});

// Lines 72-78:
export const apolloClient = new ApolloClient({
  link: forceMock ? mockLink : networkPipeline,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
```
- **Finding**:
  1. `forceMock ? mockLink : networkPipeline`: Even if the backend at `http://localhost:8000/graphql` is running, `forceMock` routes all queries straight to `mockLink`.
  2. Even if `VITE_USE_MOCK=false`, `resilientFallbackLink` wraps `httpLink`. Whenever an HTTP error occurs OR a GraphQL schema error is returned, it falls back to `mockLink`. This creates a silent masking mechanism where developers assume queries are succeeding when they are actually returning in-memory mock data.

### 4.4 In-Memory Resolvers & Mutation State (`src/graphql/resolvers.ts`)
- **File Path**: `apps/brics-portal/src/graphql/resolvers.ts`
- **Lines**: 44–131
- **Exact Code Mechanism**:
```typescript
export const resolvers = {
  Query: {
    federatedNodes: (): FederatedNode[] => mockNodes,
    federatedRounds: (_: unknown, args?: FederatedRoundsArgs): FederatedRound[] => {
      if (args?.status) return mockRounds.filter((r) => r.status === args.status);
      return mockRounds;
    },
    federatedRound: (_: unknown, args: FederatedRoundArgs): FederatedRound | undefined => {
      return mockRounds.find((r) => r.id === args.id);
    },
    federatedModelVersions: () => mockModelVersions,
    federatedPrivacyBudget: () => mockPrivacyBudget,
  },

  Mutation: {
    startFederatedRound: (_: unknown, args: StartRoundArgs): FederatedRound => {
      const newRound = { ... };
      mockRounds.push(newRound); // In-memory mutation
      return newRound;
    },
    approveAggregatedModel: (_: unknown, args: ApproveModelArgs): FederatedRound => {
      const round = mockRounds.find((r) => r.id === args.roundId);
      round.status = 'approved';
      ...
      return round;
    },
    rejectAggregatedModel: (_: unknown, args: RejectModelArgs): FederatedRound => {
      ...
    },
    toggleCountryParticipation: (_: unknown, args: ToggleCountryArgs): FederatedNode => {
      const node = mockNodes.find((n) => n.countryCode === args.countryCode);
      node.status = args.enabled ? 'participating' : 'paused';
      return node;
    },
  },
};
```
- **Finding**: All mutations in `brics-portal` modify JavaScript arrays in browser memory (`mockRounds.push(newRound)`). Upon page refresh, state resets to the initial constants in `mock-data.ts`.

### 4.5 Static Mock Datasets in `brics-portal`
1. `src/graphql/mock-data.ts` (16,707 bytes):
   - `mockNodes` (Lines 16–64): 5 country nodes (IN, BR, RU, CN, ZA).
   - `mockRounds` (Lines 66–173): 4 fake training rounds (`round-2026-09-09-018`, `round-2026-09-08-017`, etc.).
   - `mockModelVersions` (Lines 175–276): 4 model versions (`demand-forecaster-v1.19`, etc.).
   - `mockPrivacyBudget` (Lines 278–397): 15 privacy budget entries.
2. `src/graphql/mock-node-details.ts` (11,468 bytes):
   - `mockNodeHistories` (Lines 25–318): Hardcoded per-country training history (`loss`, `accuracy`, `validationLoss`, `samples`) and submission logs (`weightDeltaHash`, `sampleCount`, `localLoss`).

### 4.6 Direct Mock Dependencies in Pages
- **`src/pages/NodesPage.tsx`**:
  - Line 33: `import { mockNodeHistories, NodeSubmissionLog } from '@/graphql/mock-node-details';`
  - Lines 44–50: `const COUNTRY_STATS: Record<string, { samples: number; dpSpent: number; latency: number; encryption: string }> = { IN: { samples: 1420000, ... }, ... };`
  - Line 90: `const nodeDetails = mockNodeHistories[selectedCountry] || mockNodeHistories['IN'];`
  - Line 91: `const stats = COUNTRY_STATS[selectedCountry] || ...`
  - *Finding*: While the nodes list queries `GET_FEDERATED_NODES`, the right-hand inspection drawer and training loss/accuracy charts are 100% hardcoded to `mockNodeHistories` and `COUNTRY_STATS`.
- **`src/pages/LoginPage.tsx` & `src/store/auth-store.ts`**:
  - `LoginPage.tsx` (Lines 51–57) executes a fake login timeout:
    ```typescript
    setTimeout(() => {
      login(selectedCountryCode, { email: delegateId });
      setIsLoading(false);
      navigate('/');
    }, 250);
    ```
  - It does not authenticate with any backend API, nor does it receive a real JWT.

### 4.7 Contract & Schema Incompatibilities: `brics-portal` vs Backend `graphqlServer.ts`
When `VITE_USE_MOCK=false` is set, queries from `brics-portal` will fail against the live backend `graphqlServer.ts` due to schema mismatches:

| Feature / Operation | `brics-portal` (`operations.ts` / `schema.ts`) | Backend `graphqlServer.ts` | Conflict / Failure Mode |
|---|---|---|---|
| **Privacy Budget Query** | `query GetFederatedPrivacyBudget { federatedPrivacyBudget { id countryId cumulativeEpsilon budgetLimit clipNorm noiseMultiplier ... } }` | `privacyBudgetLedger: [PrivacyBudgetEntry!]!` with fields: `id, countryId, countryCode, roundNumber, epsilonConsumed, cumulativeEpsilon, budgetLimit, withinBudget` | **Field Error**: `Cannot query field 'federatedPrivacyBudget' on type 'Query'`. Query fails; `resilientFallbackLink` forces mock schema. |
| **Start Round Mutation** | `mutation StartFederatedRound($config: StartRoundInput!) { startFederatedRound(config: $config) { id roundId modelVersion status startedAt } }` | `startFederatedRound(modelId: String!, targetEpsilon: Float!): FederatedRound!` | **Argument Mismatch**: Backend expects `modelId` and `targetEpsilon`, frontend sends `config: { targetModel, minimumNodes, roundTimeoutHours }`. |
| **Approve Model Mutation** | `mutation ApproveAggregatedModel($roundId: ID!) { approveAggregatedModel(roundId: $roundId) { id roundId modelVersion status completedAt } }` | `approveAggregatedModel(roundId: ID!, targetVersion: String!): FederatedModelVersion!` | **Return Type & Argument Mismatch**: Backend requires `targetVersion: String!` and returns `FederatedModelVersion`, frontend sends only `roundId` and expects `FederatedRound`. |
| **Reject Model Mutation** | `mutation RejectAggregatedModel($roundId: ID!, $reason: String!)` | **Not implemented in backend GraphQL schema** | **Mutation Missing**: Operation rejected with `Cannot query field 'rejectAggregatedModel' on type 'Mutation'`. |
| **Toggle Country Mutation** | `mutation ToggleCountryParticipation($countryCode: String!, $enabled: Boolean!)` | **Not implemented in backend GraphQL schema** | **Mutation Missing**: Operation rejected with `Cannot query field 'toggleCountryParticipation' on type 'Mutation'`. |
| **FederatedRound Fields** | `participatingCountries: [String!]!`, `submittedCountries: [String!]!`, `roundDeadline: String`, `aggregationSignature: String` | DB query returns these via SQL aliases, but `globalLoss`, `previousEntryHash`, `thisHash` are present in backend and omitted in frontend schema. | Tolerated if client doesn't query missing fields, but differences exist. |

---

## 5. Backend Database & GraphQL Surface Audit

The backend server was examined in `services/backend/smart-health-platform/backend`:

### 5.1 Real SQL Query Capabilities in `graphqlServer.ts`
The backend contains real SQL implementations connecting to PostgreSQL (`smarthealth` database) via `pool.query`:
- **`nationalOverview`** (Lines 372–439): Executes `SELECT count(*)::int AS total_phcs, count(*) FILTER (WHERE operational_status = 'active')::int AS active_phcs, COALESCE(sum(total_beds), 0)::int AS total_beds, COALESCE(sum(occupied_beds), 0)::int AS occupied_beds, COALESCE(sum(oxygen_cylinders_available), 0)::int AS oxygen_cylinders FROM phc_facilities`. Also queries `alerts` and `redistribution_transfers`.
- **`stateOverview`** (Lines 441–481): Queries `states` and aggregates `districts` and `phc_facilities` grouped by district.
- **`districtOverview`** (Lines 483–529): Queries `districts` and lists `phc_facilities` where `district_id = $1`.
- **`phcDetail`** (Lines 531–576): Queries specific PHC facility, state, district, beds, and coordinates.
- **`medicineIntelligence`** (Lines 578–608): Executes SQL grouping `medicines` and `inventory_batches` with `SUM(ib.remaining_qty)`.
- **`resourceIntelligence`** (Lines 610–640): Calculates available and occupied beds and oxygen cylinders from `phc_facilities`.
- **`workforceIntelligence`** (Lines 642–662): Aggregates `staff_registry` by role.
- **`patientIntelligence`** (Lines 664–685): Aggregates `patient_footfall` sums.
- **`forecasts`** (Lines 687–710): Queries `forecast_predictions`.
- **`redistributionRecommendations`** (Lines 712–745): Joins `redistribution_transfers`, `phc_facilities` (source & destination), and `medicines`.
- **`supplyChainShipments`** (Lines 747–775): Queries `redistribution_transfers` formatted as shipments.
- **`auditLog`** (Lines 777–800): Queries `audit_log` ordered by `created_at DESC`.
- **`alertsHistory`** (Lines 801–829): Queries `alerts` joined with `phc_facilities`.
- **`federatedRounds`** (Lines 842–870): Queries PostgreSQL `federation_rounds`.
- **`federatedModelVersions`** (Lines 872–884): Queries PostgreSQL `federation_model_versions`.
- **`privacyBudgetLedger`** (Lines 886–899): Queries PostgreSQL `privacy_budget_ledger`.
- **`decideRedistribution`** (Lines 902–934): Executes `UPDATE redistribution_transfers SET status = $1, decided_at = now() WHERE id = $2`.

### 5.2 Real REST Endpoints
- `GET /api/v1/phc/facilities`: Returns real active facilities from `phc_facilities`.
- `GET /api/v1/phc/:phcId/staff-list`: Returns real staff records from `staff_registry`.
- `POST /api/v1/phc/auth/verify`: Validates facility, checks staff, issues real JWT access tokens with HMAC SHA-256.
- `GET /api/v1/phc/:phcId/live-data`: Returns ground-truth bundle (facility, medicines, inventory batches, footfall, alerts, staff, requests, system configs).
- `POST /api/v1/governance/redistribution/:id/decision`: Updates redistribution transfer decision.

### 5.3 Offline Sync Engine (`syncService.ts`)
The offline sync engine handles batched push requests (`POST /sync/push`):
- `billing_transaction`: FEFO stock deduction in `inventory_batches` via `BillingService.checkout`.
- `inventory_batch_update`: Direct `INSERT/UPDATE` on `inventory_batches`.
- `facility_update`: Updates `total_beds`, `occupied_beds`, `emergency_beds`, `oxygen_cylinders_available` in `phc_facilities`.
- `alert_report`: Inserts into `alerts` with `phc_id`, `district_id`, `state_id`, `status='open'`.
- `resource_request`: Inserts into `resource_requests`.
- `footfall_entry`: Inserts into `patient_footfall`.
- `staff_attendance`: Inserts into `staff_attendance`.

---

## 6. Multi-Tier End-to-End Data Propagation Analysis

### 6.1 Flow 1: PHC -> PostgreSQL -> Governance Portal
```
+------------------+         POST /sync/push        +--------------------+
|    PHC Portal    | -----------------------------> |   Express Backend  |
|  (Beds, Stock,   |                                | (SyncService.ts)   |
|   Alerts Enqueue)|                                +--------------------+
+------------------+                                          |
                                                              v
                                                    +--------------------+
                                                    |  PostgreSQL DB     |
                                                    |  (smarthealth)     |
                                                    | - phc_facilities   |
                                                    | - inventory_batches|
                                                    | - alerts           |
                                                    +--------------------+
                                                              |
                                                              v
+------------------------+   GraphQL Query          +--------------------+
|   Governance Portal    | <----------------------- |   GraphQL Server   |
| (National/State/Dist   | (NATIONAL_OVERVIEW,      | (graphqlServer.ts) |
|  Command Center & GIS) |  MEDICINE_INTELLIGENCE)  +--------------------+
+------------------------+
```

1. **Bed Occupancy Change**:
   - In PHC Portal, user modifies bed count on `BedsView.tsx` and clicks Save.
   - Mutation `'facility_update'` with `{ total_beds: 35, occupied_beds: 30 }` is enqueued in Dexie `db.mutation_queue`.
   - `useSyncEngine` executes `POST /sync/push` with JWT and device headers.
   - `SyncService.handleFacilityMutation` executes `UPDATE phc_facilities SET total_beds = $1, occupied_beds = $2 ... WHERE id = $4`.
   - In Governance Portal, `useQuery(NATIONAL_OVERVIEW)` executes `SELECT sum(total_beds), sum(occupied_beds) FROM phc_facilities`.
   - `bedOccupancyRate` is dynamically computed as `(occupiedBeds / totalBeds) * 100`.
   - **Barrier to live display**: `app/governance/page.tsx` line 131 currently uses `bedUtilization: 74.2` hardcoded if not overridden by an SSE tick. It must be updated to read `nationalOverview.bedOccupancyRate` directly.
2. **Medicine Inventory Adjustment**:
   - In PHC Portal, user adjusts stock on `InventoryView.tsx`.
   - Mutation `'inventory_batch_update'` is pushed via `POST /sync/push`.
   - `SyncService.handleInventoryMutation` updates `inventory_batches.remaining_qty`.
   - In Governance Portal, `medicineIntelligence` query executes `SELECT m.name, SUM(ib.remaining_qty) FROM medicines m LEFT JOIN inventory_batches ib ... GROUP BY m.id`.
   - **Barrier to live display**: `src/app/medicine/page.tsx` does not call `MEDICINE_INTELLIGENCE`; it imports `MEDICINE_CATALOG` from `src/lib/medicineData.ts`. It must be refactored to execute the `MEDICINE_INTELLIGENCE` GraphQL query.
3. **Emergency Incident Alert**:
   - In PHC Portal, user triggers `EmergencyModal.tsx`.
   - Mutation `'alert_report'` is pushed via `POST /sync/push`.
   - `SyncService.handleAlertMutation` inserts into `alerts` with `district_id`, `state_id`, `severity='critical'`.
   - In Governance Portal, `nationalOverview.criticalAlertsCount` and `alertsHistory` immediately include the new alert row.

### 6.2 Flow 2: Governance Portal -> PostgreSQL -> BRICS Portal
```
+------------------------+   POST /api/v1/governance/..+--------------------+
|   Governance Portal    | --------------------------> |   Express Backend  |
| (Redistribution Decision|                            | (graphqlServer.ts/ |
|  / Federated Round)    |                            |  FederationService)|
+------------------------+                            +--------------------+
                                                              |
                                                              v
                                                    +--------------------+
                                                    |  PostgreSQL DB     |
                                                    |  (smarthealth)     |
                                                    | - redistribution_  |
                                                    |   transfers        |
                                                    | - federation_rounds|
                                                    +--------------------+
                                                              |
                                                              v
+------------------------+   GraphQL Query          +--------------------+
|      BRICS Portal      | <----------------------- |   GraphQL Server   |
| (Federated Overview,   | (GET_FEDERATED_ROUNDS,   | (graphqlServer.ts) |
|  Nodes & Lineage)      |  GET_FEDERATED_NODES)    +--------------------+
+------------------------+
```

1. **Redistribution Decision**:
   - In Governance Portal, Health Officer reviews recommendation on `redistribution/page.tsx` and approves it.
   - Invokes `POST /api/v1/governance/redistribution/:id/decision` or GraphQL mutation `decideRedistribution(transferId: $id, decision: "approved")`.
   - `redistribution_transfers.status` is updated to `'approved'` in PostgreSQL.
   - In BRICS / Governance Portal, `supplyChainShipments` query reflects the new transfer status.
2. **Federated Training Round**:
   - A governance decision initiates a new federated training round.
   - Invokes GraphQL mutation `startFederatedRound(modelId: "demand-forecaster-v1", targetEpsilon: 1.5)`.
   - `FederationService.startFederatedRound()` hashes previous block and inserts a new row into `federation_rounds` in PostgreSQL.
   - In BRICS Portal, `GET_FEDERATED_ROUNDS` query fetches `SELECT * FROM federation_rounds ORDER BY round_number DESC`.
   - The newly initiated round immediately appears in the BRICS Portal active rounds table.
   - **Barrier to live display**: BRICS Portal has `VITE_USE_MOCK=true` and in-memory mock schema link active, which ignores PostgreSQL completely. It must be rewired to execute against `http://localhost:8000/graphql`.

---

## 7. Actionable Remediation Strategy & Elimination Blueprint

To achieve 100% live database connectivity and satisfy Acceptance Criteria R1–R4, the following concrete actions must be executed:

### 7.1 Remediation for `apps/phc-portal`
1. **Deactivate/Remove `mockBackendServer`**:
   - In `apps/phc-portal/src/hooks/useSyncEngine.ts`:
     - Delete the `if (useLiveServer) ... else { return await mockBackendServer.handlePush(reqBody); }` branch.
     - Hardcode execution to live HTTP (`${backendUrl}/sync/push` and `${backendUrl}/sync/pull`).
     - Remove `useLiveServer` and `setUseLiveServer` state flags.
   - In `apps/phc-portal/src/modules/sync/SyncStatusView.tsx`:
     - Remove the "Simulated In-Browser Engine" radio toggle.
     - Remove the "Conflict Simulator" button that toggles `simulateOversoldConflict`.
     - Direct all sync operations to the live backend URL.
2. **Purge Fallback Credentials & Facilities in `PhcBackendService`**:
   - In `apps/phc-portal/src/services/phcBackendService.ts`:
     - In `verifyLogin()`: Remove lines 113–132 that permit offline clinic login with arbitrary PIN and mock token `offline-jwt-token-access`. Disallow offline mock JWT issuance; force authentication against `POST /api/v1/phc/auth/verify`.
     - In `fetchFacilities()`: Remove fallback to `FALLBACK_FACILITIES` on catch; bubble error to UI so user is aware of backend status.
     - In `hydratePhcDatabase()`: Remove lines 346–375 fallback that loads `FALLBACK_FACILITIES[0]`.

### 7.2 Remediation for `apps/governance-portal`
1. **Eliminate Apollo Client Mock Link**:
   - In `apps/governance-portal/src/lib/apolloClient.ts`:
     - Remove imports from `../graphql/mockResolvers`.
     - Delete `mockResolvers` map and `mockLink` instance.
     - Set Apollo Client link strictly to `from([errorLink, authLink, httpLink])`.
     - Eliminate `NEXT_PUBLIC_USE_MOCK` check.
2. **Replace Static TS Datasets with Live GraphQL Queries in Pages**:
   - **`src/app/medicine/page.tsx`**: Replace `MEDICINE_CATALOG` from `@/lib/medicineData` with Apollo `useQuery(MEDICINE_INTELLIGENCE)`. Map live stock, reorder levels, and coverage days directly from GraphQL data.
   - **`src/app/resources/page.tsx`**: Replace `getBedDataByScope()` and `getOxygenDataByScope()` with `useQuery(RESOURCE_INTELLIGENCE)`.
   - **`src/app/workforce/page.tsx`**: Replace `getWorkforceSummaryByScope()` with `useQuery(WORKFORCE_INTELLIGENCE)`.
   - **`src/app/patients/page.tsx`**: Replace `getPatientSummaryByScope()` with `useQuery(PATIENT_INTELLIGENCE)`.
   - **`src/app/forecasts/page.tsx`**: Replace `getForecastCardsByScope()` with `useQuery(FORECASTS)`.
   - **`src/app/audit/page.tsx`**: Refactor `useAuditStore` to query `useQuery(AUDIT_LOG)` and sync PostgreSQL `audit_log` records instead of local `INITIAL_AUDIT_LOG`.
   - **`src/app/gis/page.tsx` & `src/components/gis/GisMap.tsx`**: Wire PHC points to live facilities fetched from backend (`/api/v1/phc/facilities` or GraphQL `districtOverview.phcList`) rather than static `GIS_PHCS`.
3. **Clean Up `src/app/governance/page.tsx`**:
   - Bind KPI tiles directly to `nationalOverview`, `stateOverview`, or `districtOverview` fields (`bedOccupancyRate`, `oxygenCylindersAvailable`, `occupiedBeds`, `criticalPhcs`, `openAlertsCount`).
   - Remove hardcoded KPI fallback numbers (`74.2`, `96.8`, `85.8`, `312400`, etc.).
   - Wire Panel 2 ("Where is it happening?") to render the real `stateOverview.districts` array.
   - Wire Panel 4 ("What should we do?") to render real items from `redistributionRecommendations` query.

### 7.3 Remediation for `apps/brics-portal`
1. **Switch Environment to Live Mode**:
   - In `apps/brics-portal/.env`: Change `VITE_USE_MOCK=false`.
2. **Remove SchemaLink & Mock Fallback Link**:
   - In `apps/brics-portal/src/graphql/client.ts`:
     - Remove `makeExecutableSchema`, `mockSchema`, `mockLink = new SchemaLink(...)`.
     - Remove `resilientFallbackLink` so network/GraphQL errors are surfaced cleanly to Apollo's error handler instead of silently triggering mock schema fallback.
     - Connect Apollo Client strictly to `from([errorLink, authLink, httpLink])`.
3. **Harmonize Schema & Operations with Backend `graphqlServer.ts`**:
   - Update `apps/brics-portal/src/graphql/operations.ts`:
     - Change `federatedPrivacyBudget` query to `privacyBudgetLedger`.
     - Harmonize `StartFederatedRound` mutation parameters to match backend (`modelId`, `targetEpsilon`), or enhance backend `graphqlServer.ts` to accept `StartRoundInput`.
     - Harmonize `approveAggregatedModel` arguments and return type.
     - Add `rejectAggregatedModel` and `toggleCountryParticipation` mutations to backend `graphqlServer.ts`.
4. **Remove Mock Bindings in `src/pages/NodesPage.tsx`**:
   - Remove `import { mockNodeHistories } from '@/graphql/mock-node-details'`.
   - Remove static `COUNTRY_STATS` constant.
   - Bind node details and history directly to GraphQL query response.
5. **Implement Real Backend Authentication in `src/pages/LoginPage.tsx`**:
   - Connect login form to `POST /api/v1/auth/login` to obtain real JWT access token.
   - Store token in `localStorage.setItem('brics_auth_token', token)`.

### 7.4 Dual-Path Synchronization Discipline
Once changes are made in `C:\Users\anshv\OneDrive\Desktop\Smart_governance`, sync all modified files across to the runtime path:
`C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`

### 7.5 Verification Plan
1. **Automated Verification Script**: Create an integration test script that performs:
   - Step 1: Health checks on ports 8000, 3000, 5173, and BRICS portal.
   - Step 2: PHC mutation injection via `POST /sync/push` (e.g. updating occupied beds to 29 on PHC `c0000003-0000-0000-0000-000000000001`).
   - Step 3: Query Governance GraphQL `nationalOverview` and assert `occupiedBeds` and `bedOccupancyRate` reflect the updated database value.
   - Step 4: Governance decision mutation `decideRedistribution` and assert status changes in PostgreSQL.
   - Step 5: Query BRICS `GET_FEDERATED_ROUNDS` and assert live round list from PostgreSQL.
2. **Lint & Build Verification**: Run `npm run build` or `npm run typecheck` across all 3 portals to verify zero schema/type errors.
