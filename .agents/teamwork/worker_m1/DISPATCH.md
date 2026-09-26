# Task Assignment — Worker M1 (Frontend Mock Elimination & Live Portal Connectivity)

## Identity
- Role: Frontend Portals Implementation Worker
- TypeName: teamwork_preview_worker
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1

## Mandatory References
- ORIGINAL_REQUEST.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (MUST READ FIRST)
- PROJECT.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md
- Explorer 1 Survey Report: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\survey_report.md
- Explorer 1 Handoff: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\handoff.md

## Exclusive Write Ownership
You EXCLUSIVELY own files in:
- `apps/phc-portal/**`
- `apps/governance-portal/**`
- `apps/brics-portal/**`
Do NOT edit any files in `services/backend/` or `services/ai-engine/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Tasks
Eliminate all mock data fallbacks, fake schemas, Apollo error link fallback mechanisms, static TS datasets, and in-memory mock states across all three portals:

1. **`apps/phc-portal`**:
   - In `src/hooks/useSyncEngine.ts`: remove `useLiveServer` state branching. Always route `executePush` and `executePull` to live backend endpoints (`/sync/push` and `/sync/pull`).
   - In `src/utils/mockBackend.ts`: eliminate mock server execution.
   - In `src/modules/sync/SyncStatusView.tsx`: remove simulation toggle UI for in-browser mock engine and simulated oversold conflict.
   - In `src/services/phcBackendService.ts`: remove hardcoded `FALLBACK_FACILITIES` and remove offline fallback PIN authentication that generates `offline-jwt-token-access`. Always verify against live backend `POST /api/v1/phc/auth/verify`.
   - In `src/modules/inventory/InventoryView.tsx`: when enqueuing `inventory_batch_update`, ensure `batch_no` is included or provided from the selected batch item (or `batch_id`). Ensure batch receiving (`inventory_batch_create`) sends proper fields.

2. **`apps/governance-portal`**:
   - In `src/lib/apolloClient.ts`: remove `mockResolvers` and `mockLink`. Connect directly and strictly to live GraphQL endpoint (`/graphql` / `http://localhost:8000/graphql`). On error, throw/log error, do NOT return fake data.
   - In `src/app/governance/page.tsx`: eliminate hardcoded baseline KPIs (`bedUtilization: 74.2`, `oxygenStatus: 96.8`, etc.), hardcoded sparklines, hardcoded meter percentages, and static district table rows. Bind directly to live GraphQL query results (`nationalOverview`, `stateOverview`, `districtOverview`).
   - In static pages (`src/app/medicine/page.tsx`, `src/app/resources/page.tsx`, `src/app/workforce/page.tsx`, `src/app/patients/page.tsx`, `src/app/forecasts/page.tsx`, `src/app/audit/page.tsx`, `src/app/analytics/page.tsx`, `src/components/gis/GisMap.tsx`, `src/components/admin/SyncMonitoringView.tsx`): replace imports of static `@/lib/*Data.ts` with live Apollo GraphQL queries (`MEDICINE_INTELLIGENCE`, `RESOURCE_INTELLIGENCE`, `WORKFORCE_INTELLIGENCE`, `PATIENT_INTELLIGENCE`, `FORECASTS`, `AUDIT_LOG`, etc.) or live REST calls.

3. **`apps/brics-portal`**:
   - In `.env`: ensure `VITE_USE_MOCK=false`.
   - In `src/graphql/client.ts`: remove `SchemaLink`, remove in-memory `mockLink`, and eliminate `resilientFallbackLink` fallback catch. Use standard Apollo HTTP link to `http://localhost:8000/graphql` (or `/graphql`).
   - In `src/pages/NodesPage.tsx`: eliminate static imports of `mockNodeHistories` and `COUNTRY_STATS`; bind directly to GraphQL queries `GET_FEDERATED_NODES`.
   - Harmonize GraphQL query and mutation operations in `src/graphql/operations.ts` with the backend schema (use `privacyBudgetLedger`, support `startFederatedRound(modelId, targetEpsilon, minParticipatingNodes)`).

4. **Build & Typecheck Verification**:
   - Run typecheck / build for affected portal packages to verify no syntax or TypeScript compilation errors.
   - Document all changes, modified files, and test results in `handoff.md`.

## 2026-09-26T13:03:46Z
You are Worker M1 (Role: Frontend Portals Implementation Worker).
Your working directory is: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1
Tasks:
1. apps/phc-portal:
   - Remove useLiveServer branching in src/hooks/useSyncEngine.ts; route executePush and executePull to live backend endpoints (/sync/push and /sync/pull).
   - Eliminate mock server execution in src/utils/mockBackend.ts.
   - Remove simulation controls from src/modules/sync/SyncStatusView.tsx.
   - Remove FALLBACK_FACILITIES and offline PIN bypass in src/services/phcBackendService.ts.
   - In src/modules/inventory/InventoryView.tsx, ensure inventory_batch_update sends batch_no and inventory_batch_create sends proper fields.
2. apps/governance-portal:
   - In src/lib/apolloClient.ts, remove mockResolvers and mockLink. Direct all queries strictly to the live GraphQL endpoint.
   - In src/app/governance/page.tsx, remove hardcoded baseline KPIs, static sparklines, static meters, and static district rows. Bind to real GraphQL query results.
   - In static pages (medicine, resources, workforce, patients, forecasts, audit, analytics, gis, sync monitoring), replace imports of static @/lib/*Data.ts with live GraphQL queries or live API calls.
3. apps/brics-portal:
   - Set VITE_USE_MOCK=false in .env.
   - Remove SchemaLink, mockLink, and resilientFallbackLink in src/graphql/client.ts. Use live Apollo HTTP link to http://localhost:8000/graphql.
   - In src/pages/NodesPage.tsx, eliminate static imports of mockNodeHistories and COUNTRY_STATS; bind to GET_FEDERATED_NODES.
   - Harmonize operations in src/graphql/operations.ts with the backend schema (privacyBudgetLedger, startFederatedRound).
4. Run typecheck / build on the portal packages to verify no compilation errors.
5. Document all changes and build results in C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1\handoff.md and send message to parent upon completion.
