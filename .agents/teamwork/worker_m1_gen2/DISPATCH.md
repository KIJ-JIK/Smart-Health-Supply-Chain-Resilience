# Task Assignment — Worker M1 (Gen 2: Replacement from Interruption Point)

## Identity
- Role: Frontend Portals Replacement Worker
- TypeName: teamwork_preview_worker
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1_gen2

## Mandatory References
- ORIGINAL_REQUEST.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (MUST READ FIRST)
- PROJECT.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md
- Explorer 1 Report: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\survey_report.md

## Exclusive Write Ownership
You EXCLUSIVELY own files in:
- `apps/governance-portal/**`
- `apps/brics-portal/**`
- `apps/phc-portal/**`
Do NOT modify files in `services/backend/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Prior Progress (Worker M1 Gen 1)
Predecessor worker already completed `apps/phc-portal`:
- Removed `useLiveServer` branching in `src/hooks/useSyncEngine.ts`.
- Removed mock server execution in `src/utils/mockBackend.ts`.
- Removed simulation controls from `src/modules/sync/SyncStatusView.tsx`.
- Removed `FALLBACK_FACILITIES` and offline PIN bypass in `src/services/phcBackendService.ts`.
- Updated `src/modules/inventory/InventoryView.tsx`.

## Exact Remaining Tasks (Complete these to finish Milestone M1):
1. **`apps/governance-portal` Mock Elimination**:
   - In `src/lib/apolloClient.ts`: remove `mockResolvers` and `mockLink`. Direct all GraphQL operations directly and strictly to live GraphQL endpoint (`/graphql` / `http://localhost:8000/graphql`).
   - In `src/app/governance/page.tsx`: eliminate hardcoded baseline KPIs (`bedUtilization: 74.2`, `oxygenStatus: 96.8`, etc.), hardcoded sparklines, static meters, and static district table rows. Bind directly to live GraphQL query results (`nationalOverview`, `stateOverview`, `districtOverview`).
   - In static pages (`medicine`, `resources`, `workforce`, `patients`, `forecasts`, `audit`, `analytics`, `gis`): replace imports of static `@/lib/*Data.ts` with live Apollo GraphQL queries (`MEDICINE_INTELLIGENCE`, `RESOURCE_INTELLIGENCE`, `WORKFORCE_INTELLIGENCE`, `PATIENT_INTELLIGENCE`, `FORECASTS`, `AUDIT_LOG`, etc.) or live API calls.
2. **`apps/brics-portal` Mock Elimination**:
   - In `.env`: set `VITE_USE_MOCK=false`.
   - In `src/graphql/client.ts`: remove `SchemaLink`, remove in-memory `mockLink`, and remove `resilientFallbackLink` fallback catch. Use standard live Apollo HTTP link to `http://localhost:8000/graphql`.
   - In `src/pages/NodesPage.tsx`: eliminate static imports of `mockNodeHistories` and `COUNTRY_STATS`; bind directly to GraphQL queries `GET_FEDERATED_NODES`.
   - In `src/graphql/operations.ts`: harmonize query and mutation operations with backend schema (`privacyBudgetLedger`, `startFederatedRound`).
3. **Build & Typecheck Verification**:
   - Verify typecheck passes on the portals.
4. **Handoff**:
   - Author `handoff.md` in your working directory and notify parent via send_message.
