# 5-Component Handoff Report: Portal Mock Investigation & Clean Live API Strategy

**Agent**: Explorer 1 (Role: Codebase & Portal Mock Investigator)  
**Date**: 2026-09-26  
**Folder**: `C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1`  
**Related Deliverable**: `C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\survey_report.md`  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

Direct observations from codebase inspection across `apps/phc-portal`, `apps/governance-portal`, `apps/brics-portal`, and `services/backend`:

### A. `apps/phc-portal`
1. **`apps/phc-portal/src/utils/mockBackend.ts` (Lines 12–100)**:
   Contains in-memory mock server `mockBackendServer` with local sequence counter `currentServerSeq = 100`, processed mutation tracking, latency simulation (`await new Promise((res) => setTimeout(res, 400))`), and simulated conflict generation:
   ```typescript
   if (this.simulateOversoldConflict && m.entity_type === 'billing_transaction') {
     const reqQty = m.payload?.items?.[0]?.quantity || 10;
     const availQty = Math.max(1, Math.floor(reqQty / 2));
     results.push({
       mutation_id: m.id,
       status: 'conflict',
       error_code: 'STOCK_OVERSOLD',
       conflict: { conflict_type: 'stock_oversold', ... }
     });
   }
   ```
2. **`apps/phc-portal/src/hooks/useSyncEngine.ts` (Lines 19, 93–121, 127–154)**:
   Maintains state `const [useLiveServer, setUseLiveServer] = useState(true);`. In `executePush`:
   ```typescript
   if (useLiveServer) {
     const resp = await fetch(`${backendUrl}/sync/push`, ...);
     return await resp.json();
   } else {
     return await mockBackendServer.handlePush(reqBody);
   }
   ```
   And similarly in `executePull`:
   ```typescript
   if (useLiveServer) { ... }
   else { return await mockBackendServer.handlePull(sinceSeq, CURRENT_DEVICE_ID); }
   ```
3. **`apps/phc-portal/src/modules/sync/SyncStatusView.tsx` (Lines 264–285, 301–315)**:
   Exposes radio buttons in UI allowing users to switch target backend mode to `Simulated In-Browser Engine` (`onChange={() => setUseLiveServer(false)}`) and a button to toggle `mockBackendServer.simulateOversoldConflict`.
4. **`apps/phc-portal/src/services/phcBackendService.ts` (Lines 22–35, 113–132, 346–375)**:
   - `FALLBACK_FACILITIES` array contains 12 hardcoded facility records (lines 22–35).
   - In `verifyLogin()`, lines 114–131 intercept authentication when backend fails or any PIN is entered:
     ```typescript
     if (params.pin === 'clinic@2026' || params.pin.trim().length > 0) {
       console.warn('[PhcBackendService] Backend offline, authenticating in offline resilience mode');
       ...
       return {
         success: true,
         tokens: { accessToken: 'offline-jwt-token-access', refreshToken: 'offline-jwt-token-refresh' },
         staff: { ... }, facility,
       };
     }
     ```
   - In `hydratePhcDatabase()`, catch block (lines 346–375) populates Dexie `db.phc_facilities` with `FALLBACK_FACILITIES[0]` instead of failing.

### B. `apps/governance-portal`
1. **`apps/governance-portal/src/lib/apolloClient.ts` (Lines 75–111, 115–125)**:
   Contains `mockResolvers` map (12 resolvers) and `mockLink = new ApolloLink(...)` simulating 200–500ms latency and returning mock data. Activated when `NEXT_PUBLIC_USE_MOCK === 'true'`.
2. **`apps/governance-portal/src/graphql/mockResolvers.ts` (Lines 1–290)**:
   Full mock resolver implementation returning randomized and synthetic values for `nationalOverview`, `stateOverview`, `districtOverview`, `phcDetail`, `medicineIntelligence`, `resourceIntelligence`, `workforceIntelligence`, `patientIntelligence`, `forecasts`, `redistributionRecommendations`, `supplyChainShipments`, and `auditLog`.
3. **Static Datasets in `src/lib/*Data.ts` & Page Bypasses**:
   - `src/app/medicine/page.tsx:8, 54`: Bypasses `MEDICINE_INTELLIGENCE` GraphQL query; binds to `MEDICINE_CATALOG` in `src/lib/medicineData.ts`.
   - `src/app/resources/page.tsx:12-23`: Bypasses `RESOURCE_INTELLIGENCE` GraphQL query; binds to `getBedDataByScope()` and `getOxygenDataByScope()` in `src/lib/resourceData.ts`.
   - `src/app/workforce/page.tsx:11-20`: Bypasses `WORKFORCE_INTELLIGENCE` GraphQL query; binds to `getWorkforceSummaryByScope()` in `src/lib/workforceData.ts`.
   - `src/app/patients/page.tsx:12-22`: Bypasses `PATIENT_INTELLIGENCE` GraphQL query; binds to `getPatientSummaryByScope()` in `src/lib/patientData.ts`.
   - `src/app/forecasts/page.tsx:10-14`: Bypasses `FORECASTS` GraphQL query; binds to `getForecastCardsByScope()` in `src/lib/forecastData.ts`.
   - `src/app/audit/page.tsx` & `src/store/auditStore.ts:9, 20`: Bypasses `AUDIT_LOG` GraphQL query; loads `INITIAL_AUDIT_LOG` from `src/lib/auditData.ts` into localStorage (`'governance_audit_log_v1'`).
   - `src/app/analytics/page.tsx:10-15`: Bypasses backend; renders `REPORT_TIERS` and `INITIAL_GENERATED_REPORTS` from `src/lib/analyticsData.ts`.
   - `src/components/gis/GisMap.tsx:13-19`: Renders static `GIS_PHCS` and `GIS_SUPPLY_ROUTES` from `src/lib/gisData.ts`.
   - `src/components/admin/SyncMonitoringView.tsx` & `src/store/syncMonitoringStore.ts:11-13`: Renders `INITIAL_PHC_SYNC_TELEMETRY` and `INITIAL_MUTATION_QUEUE` from `src/lib/syncMonitoringData.ts`.
4. **`apps/governance-portal/src/app/governance/page.tsx`**:
   - Baseline KPI values (lines 124–167) fall back to hardcoded numbers (`bedUtilization: 74.2`, `oxygenStatus: 96.8`, `staffAvailability: 85.8`, `patientLoad: 312400`).
   - Hardcoded sparkline data arrays (lines 303, 320, 338, 355, 372, 457).
   - Panel 1 meters (lines 516–548) hardcoded to 87.4%, 98.2%, 82.5%.
   - Panel 2 district table (lines 681–731) hardcoded to 5 static district rows.
   - Panel 3 forecast curve (lines 64–71) hardcoded to static `FORECAST_CURVE`.
   - Panel 4 recommendations and emergency escalations (lines 1015–1150) hardcoded in JSX.

### C. `apps/brics-portal`
1. **`apps/brics-portal/.env` (Line 1)**:
   Explicitly sets `VITE_USE_MOCK=true`.
2. **`apps/brics-portal/src/graphql/client.ts` (Lines 16–48, 72–78)**:
   - Line 17: `const mockSchema = makeExecutableSchema({ typeDefs, resolvers });`
   - Line 18: `const mockLink = new SchemaLink({ schema: mockSchema });`
   - Lines 23–48: `resilientFallbackLink` wraps the network pipeline. If any network error occurs, or if GraphQL returns errors without data, it calls `mockLink.request(operation)?.subscribe(observer)`.
   - Line 73: `link: forceMock ? mockLink : networkPipeline`.
3. **`apps/brics-portal/src/graphql/resolvers.ts` (Lines 44–131)**:
   In-memory mock resolvers that mutate local arrays (`mockRounds.push(newRound)`, updating `mockModelVersions`, mutating `mockNodes`).
4. **`apps/brics-portal/src/graphql/mock-data.ts` & `mock-node-details.ts`**:
   Large static datasets defining mock country nodes, rounds, model versions, and privacy budget.
5. **`apps/brics-portal/src/pages/NodesPage.tsx` (Lines 33, 44–50, 90)**:
   Directly imports `mockNodeHistories` from `src/graphql/mock-node-details` and uses hardcoded `COUNTRY_STATS`.
6. **Schema Discrepancies vs Backend `graphqlServer.ts`**:
   - Query name: `federatedPrivacyBudget` in brics-portal vs `privacyBudgetLedger` in backend `graphqlServer.ts`.
   - Mutation args: `startFederatedRound(config: StartRoundInput!)` in brics-portal vs `startFederatedRound(modelId: String!, targetEpsilon: Float!)` in backend.
   - Mutations missing in backend: `rejectAggregatedModel` and `toggleCountryParticipation`.

### D. Backend Capabilities (`services/backend/smart-health-platform/backend`)
1. **`graphqlServer.ts`**: Live PostgreSQL connection pool executing real queries for `nationalOverview`, `stateOverview`, `districtOverview`, `phcDetail`, `medicineIntelligence`, `resourceIntelligence`, `workforceIntelligence`, `patientIntelligence`, `forecasts`, `redistributionRecommendations`, `supplyChainShipments`, `auditLog`, `alertsHistory`, `federatedRounds`, and `privacyBudgetLedger`.
2. **`syncService.ts`**: Live synchronization engine applying incoming offline mutations directly to `phc_facilities`, `inventory_batches`, `alerts`, `patient_footfall`, `staff_attendance`, and `resource_requests`.

---

## 2. Logic Chain

1. **Observation 1 (PHC Mock Sync Branch & Fallback Auth)** + **Observation 4 (Backend Capabilities)**:
   Because `apps/phc-portal/src/hooks/useSyncEngine.ts` contains an alternate branch routing mutations to `mockBackendServer`, and `phcBackendService.ts` issues dummy tokens (`offline-jwt-token-access`), any failure in authentication or manual switch in `SyncStatusView.tsx` completely isolates the PHC Portal from PostgreSQL. When isolated, edits to bed counts or medicine stocks never reach PostgreSQL. Conversely, when `useLiveServer=true` and authenticating via real backend `POST /api/v1/phc/auth/verify`, `useSyncEngine` sends mutations via `POST /sync/push`, which `SyncService` updates directly in PostgreSQL tables `phc_facilities` and `inventory_batches`.
2. **Observation 2 (Governance Static Datasets & Hardcoded Page Panels)** + **Observation 4 (Backend SQL Capabilities)**:
   In `apps/governance-portal`, even though the backend GraphQL server executes real queries against PostgreSQL, 8 key pages (`medicine`, `resources`, `workforce`, `patients`, `forecasts`, `audit`, `analytics`, `gis`) never invoke those queries; they import static datasets from `src/lib/*Data.ts`. Furthermore, `app/governance/page.tsx` sets `bedUtilization: 74.2` and hardcodes Panel 2 district lists and Panel 4 recommendations in JSX. Consequently, changes made in PostgreSQL via the PHC portal never reflect on the Governance Portal unless these pages are refactored to execute live Apollo GraphQL queries and bind directly to query results.
3. **Observation 3 (BRICS Mock Enforcement & Schema Mismatch)** + **Observation 4 (Backend Federation Capabilities)**:
   In `apps/brics-portal`, `VITE_USE_MOCK=true` forces `apolloClient` to use `SchemaLink` with in-memory resolvers. Even when `VITE_USE_MOCK=false`, the `resilientFallbackLink` intercepts errors and falls back to `mockLink`. Because operations in `operations.ts` mismatch the backend `graphqlServer.ts` schema (e.g. querying `federatedPrivacyBudget` instead of `privacyBudgetLedger`, and differing mutation signatures), any live query fails and immediately falls back to the in-memory mock schema. Therefore, governance decisions and federated rounds created in PostgreSQL are invisible in the BRICS Portal until `VITE_USE_MOCK=false`, `resilientFallbackLink` is removed, and GraphQL schemas are harmonized.

---

## 3. Caveats

1. **AI Engine Service (`services/ai-engine`)**: The AI engine microservice was noted in `services/ai-engine` but not deeply audited, as portal mock data and PostgreSQL cross-tier connectivity are governed by the Express backend (`services/backend`) and the three portal frontends.
2. **Browser Storage State**: Browsers or test runners with preexisting `localStorage` entries (e.g. `governance_audit_log_v1` in `auditStore.ts` or `phc-portal-auth` in `authStore.ts`) may continue to serve cached mock objects until cleared.
3. **Alternative Interpretation Considered**: We considered whether `resilientFallbackLink` and `mockResolvers` should be kept as "safe fallbacks" for offline operation. However, Requirement R1 explicitly dictates: *"Deactivate or remove all client-side mock fallback schemas and static fallback datasets across all three portals so that all rendered statistics, tables, and charts are sourced strictly from live database records."* Therefore, retaining fallback links violates the explicit requirement.

---

## 4. Conclusion

1. All three portals currently rely on active mock data fallbacks, fake schemas, or static TypeScript datasets:
   - `phc-portal`: `mockBackend.ts`, `useSyncEngine.ts` branching, `SyncStatusView.tsx` simulation controls, and `phcBackendService.ts` offline fallbacks.
   - `governance-portal`: `apolloClient.ts` mockLink, `mockResolvers.ts`, 8 pages reading static datasets in `src/lib/*Data.ts`, and hardcoded panels in `governance/page.tsx`.
   - `brics-portal`: `VITE_USE_MOCK=true`, `SchemaLink` in `graphql/client.ts`, `resilientFallbackLink`, in-memory `resolvers.ts`, `mock-node-details.ts`, and operation schema mismatches.
2. The live backend (`services/backend/smart-health-platform/backend`) is fully capable of providing real data from PostgreSQL for all three tiers once the frontend portals are cleanly connected and the schema mismatches are resolved.
3. Eliminating all mocks and connecting cleanly requires a coordinated multi-step remediation across all three portals as specified in Section 7 of `survey_report.md`.

---

## 5. Verification Method

To independently verify all findings and validate the elimination of mocks:

### Inspection Commands
1. Verify mock link and schemas in `brics-portal`:
   ```powershell
   Select-String -Path "apps\brics-portal\src\graphql\client.ts" -Pattern "SchemaLink", "mockLink", "resilientFallbackLink"
   Get-Content "apps\brics-portal\.env"
   ```
2. Verify static dataset usage in `governance-portal`:
   ```powershell
   Select-String -Path "apps\governance-portal\src\app\medicine\page.tsx" -Pattern "MEDICINE_CATALOG"
   Select-String -Path "apps\governance-portal\src\app\resources\page.tsx" -Pattern "getBedDataByScope"
   Select-String -Path "apps\governance-portal\src\lib\apolloClient.ts" -Pattern "mockResolvers", "mockLink"
   ```
3. Verify mock backend in `phc-portal`:
   ```powershell
   Select-String -Path "apps\phc-portal\src\hooks\useSyncEngine.ts" -Pattern "mockBackendServer"
   Select-String -Path "apps\phc-portal\src\services\phcBackendService.ts" -Pattern "FALLBACK_FACILITIES", "offline-jwt-token-access"
   ```

### Live End-to-End Verification Flow (Upon Implementation)
1. **Start Services**: Ensure Backend (port 8000), Governance Portal (port 3000), PHC Portal (port 5173), and BRICS Portal are running.
2. **Execute Cross-Tier Script**:
   - Push a bed update from PHC Portal to backend via `POST /sync/push` (e.g. facility `c0000003-0000-0000-0000-000000000001` with `total_beds: 40`, `occupied_beds: 35`).
   - Query GraphQL `POST http://localhost:8000/graphql` with `{ nationalOverview { totalBeds occupiedBeds bedOccupancyRate } }`.
   - Assert `totalBeds` and `occupiedBeds` match PostgreSQL and `bedOccupancyRate == 87.5%`.
   - Update redistribution decision via `POST /api/v1/governance/redistribution/:id/decision` and assert status in PostgreSQL.
   - Start federated round via `mutation { startFederatedRound(...) }` and query BRICS `GET_FEDERATED_ROUNDS`. Assert round exists in PostgreSQL `federation_rounds`.
3. **Invalidation Condition**: If any portal displays metrics or tables when port 8000 is stopped without showing an explicit network/connection error, a mock or cached fallback is still active.
