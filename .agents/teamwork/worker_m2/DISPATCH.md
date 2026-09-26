# Task Assignment — Worker M2 (Backend Propagation Pipeline & Database Seeds)

## Identity
- Role: Backend & Database Pipeline Implementation Worker
- TypeName: teamwork_preview_worker
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m2

## Mandatory References
- ORIGINAL_REQUEST.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (MUST READ FIRST)
- PROJECT.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md
- Explorer 2 Survey Report: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\survey_report.md
- Explorer 2 Handoff: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\handoff.md

## Exclusive Write Ownership
You EXCLUSIVELY own files in:
- `services/backend/smart-health-platform/backend/**`
- `datasets/**`
Do NOT edit any files in `apps/phc-portal/`, `apps/governance-portal/`, or `apps/brics-portal/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Tasks
Fix the backend multi-tier data propagation pipeline across PostgreSQL, Express routes, and Apollo GraphQL:

1. **`syncService.ts` Mutations**:
   - In `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts`:
     - Add explicit case handling for `'inventory_batch_create'`.
     - In `handleInventoryMutation`, if `p.batch_no` is not provided in `inventory_batch_update`, update `inventory_batches` by `id = p.id` (or `p.batch_id`) and update `remaining_qty`, `updated_at`, rather than failing on `ON CONFLICT (phc_id, medicine_id, batch_no)`.
     - Support `'outbreak'` alerts mapping to `'outbreak_risk'` in `alerts` table so emergency outbreak alerts from PHC reflect in governance outbreak queries.

2. **`graphqlServer.ts` Dynamic Aggregations & Resilient Slugs**:
   - In `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts`:
     - In `stateOverview` resolver (around lines 460-475): replace hardcoded numbers (`stockoutAlerts: 3`, `criticalShortages: 2`, `bedOccupancyRate: 84.5`, `criticalAlertsCount: 4`) with live SQL queries aggregating real records from `alerts`, `phc_facilities`, and `inventory_batches`.
     - In `districtOverview` resolver (around lines 510-525): replace hardcoded numbers (`stockoutAlerts: 2`, `pendingRequestsCount: 1`, `openAlertsCount: 3`) with live SQL queries.
     - Add resilient slug/code matching for states (`WHERE id = $1 OR code = $1 OR lower(name) = lower($1) OR id = (SELECT id FROM states WHERE code = upper($1) LIMIT 1)`) and districts (`WHERE id = $1 OR lower(name) = lower($1) OR id = (SELECT id FROM districts WHERE lower(name) LIKE '%' || lower($1) || '%' LIMIT 1)`).
     - Add missing BRICS query resolver `federatedRound(id: ID!)`.
     - Ensure `FederatedModelVersion` fields (`baseModelVersion`, `s3Uri`, `metrics`, etc.) and `PrivacyBudgetEntry` fields match brics-portal requirements.
     - Add alias or resolver for `privacyBudgetLedger` returning privacy budget records.
     - In `decideRedistribution` mutation: invoke `GovernanceService.decideRedistribution` and publish `redistribution.approved` to `eventBus` so `SupplyChainService` creates tracking shipments in `supply_chain_shipments`.
     - Ensure `supplyChainShipments` resolver queries real `supply_chain_shipments` records.

3. **Express Redistribution Routes**:
   - In `services/backend/smart-health-platform/backend/src/index.ts`:
     - Mount redistribution router at `/api/v1/governance/redistribution` providing:
       - `GET /recommendations`: returns active recommendations for district/state from PostgreSQL.
       - `POST /:id/decision`: receives `{ decision, notes }`, updates `redistribution_transfers`, publishes approval event, returns `{ success: true, transfer }`.

4. **Database Canonical Seeds**:
   - Verify PostgreSQL `smarthealth` has all 10 canonical states, 50 districts, and 120 PHCs from canonical seeds. If any are missing, ensure seed scripts or migrations populate them.
   - Insert initial seed records for `federation_rounds` (e.g. 5 rounds), `privacy_budget_ledger`, and `federation_model_versions` if currently empty, so BRICS queries return rich live data.

5. **Build & Test Verification**:
   - Run TypeScript typecheck / build for `services/backend/smart-health-platform/backend`.
   - Verify server starts and endpoints respond.
   - Document all changes, files touched, and test commands in `handoff.md`.

## 2026-09-26T13:03:46Z
User request received: Worker M2 Backend & Database Pipeline Implementation.
- syncService.ts mutations
- graphqlServer.ts dynamic aggregations & resilient slugs
- Express Redistribution Routes
- Database Seeds (canonical 10 states, 50 districts, 120 PHCs, BRICS tables)
- Build & test verification

## 2026-09-26T13:20:41Z
Message from parent:
**Context**: Status and schema assistance for Worker M2
**Content**: The columns of table `redistribution_transfers` are:
- `id` (UUID)
- `source_phc_id` (UUID)
- `dest_phc_id` (UUID)
- `item_ref` (UUID)
- `item_type` (VARCHAR)
- `quantity` (INT)
- `recommended_by` (VARCHAR)
- `status` (VARCHAR: 'recommended', 'approved', 'in_transit', 'delivered', 'rejected', 'cancelled')
- `decided_by` (UUID)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `decided_at` (TIMESTAMPTZ)

Please proceed with creating and mounting the redistribution router at `/api/v1/governance/redistribution` in `src/index.ts`, run typecheck/build verification, and deliver your handoff.md report.
**Action**: Complete implementation and verification.
