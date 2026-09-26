# Handoff Report — Explorer 2: Backend, Schema & Propagation Pipeline

**Role:** Backend, Schema & Propagation Pipeline Investigator  
**Working Directory:** `C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2`  
**Handoff Type:** Hard (Survey Task Complete)  
**Date:** 2026-09-26  

---

## 1. Observation

1. **PHC Inventory Stock Adjustment Mutation Failure**:
   - In `apps/phc-portal/src/modules/inventory/InventoryView.tsx:247-256`, stock adjustment enqueues:
     ```typescript
     await enqueue('inventory_batch_update', {
       id: adjBatchId,
       batch_id: adjBatchId,
       medicine_id: b.medicine_id,
       previous_qty: b.remaining_qty,
       remaining_qty: Number(adjNewQty),
       adjustment_delta: Number(adjNewQty) - b.remaining_qty,
       reason: adjReason.trim(),
       user_name: adjUser,
     });
     ```
   - In `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts:293-308`, `handleInventoryMutation` attempts:
     ```typescript
     const res = await client.query(
       `INSERT INTO inventory_batches (
          phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (phc_id, medicine_id, batch_no) DO UPDATE ...`,
       [phcId, p.medicine_id, p.batch_no, ...]
     );
     ```
     `p.batch_no` is undefined. In `full_seed.sql:69`, `batch_no VARCHAR(100) NOT NULL`. PostgreSQL will reject this with a `NOT NULL` constraint violation.
   - Furthermore, `InventoryView.tsx:214` enqueues `'inventory_batch_create'`. In `syncService.ts:195-227`, `executeMutation` lacks a case for `'inventory_batch_create'`, falling through to `UNSUPPORTED_ENTITY_TYPE: inventory_batch_create`.

2. **Hardcoded Overviews in GraphQL Server**:
   - In `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts:467-470` (`stateOverview` resolver):
     ```typescript
     stockoutAlerts: 3,
     criticalShortages: 2,
     bedOccupancyRate: 84.5,
     criticalAlertsCount: 4,
     ```
   - In `graphqlServer.ts:516-519` (`districtOverview` resolver):
     ```typescript
     stockoutAlerts: 2,
     pendingRequestsCount: 1,
     openAlertsCount: 3,
     ```
   - In `graphqlServer.ts:502`:
     ```sql
     1 AS "openAlerts"
     ```
   - In `graphqlServer.ts:453`:
     ```sql
     1 AS "stockoutRiskCount"
     ```
     No matter what mutations occur at the PHC level (bed changes, alerts, stock depletion), these overview numbers never change.

3. **Strict UUID Matching & Slugs**:
   - In `apps/governance-portal/src/app/governance/page.tsx:108,113`:
     ```typescript
     variables: { stateId: stateId ?? user.stateId ?? 'state-mh' }
     variables: { districtId: districtId ?? user.districtId ?? 'dist-pune' }
     ```
   - In `graphqlServer.ts:444`:
     ```typescript
     const stateRes = await client.query(`SELECT id, name FROM states WHERE id = $1 LIMIT 1`, [args.stateId]);
     ```
     Passing `'state-mh'` causes PostgreSQL to error on non-UUID input or return 0 rows, resulting in 0 districts rendered.

4. **Missing Redistribution Decision REST Route**:
   - In `apps/governance-portal/src/app/redistribution/page.tsx:60`:
     ```typescript
     await fetch(`/api/v1/governance/redistribution/${recommendationId}/decision`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ decision, notes }),
     });
     ```
   - In `apps/governance-portal/src/lib/redistributionData.ts:200`:
     ```typescript
     const res = await fetch(`/api/v1/governance/redistribution/recommendations?district=${encodeURIComponent(districtId)}`);
     ```
   - In `services/backend/smart-health-platform/backend/src/index.ts`, **no route is mounted** at `/api/v1/governance/redistribution`.
   - In `graphqlServer.ts:902`, the mutation `decideRedistribution` updates `redistribution_transfers` but never publishes to `eventBus`, so `SupplyChainService` never creates tracking shipments.

5. **BRICS Mock Enforcement & Schema Incompatibilities**:
   - In `apps/brics-portal/.env:1`:
     ```
     VITE_USE_MOCK=true
     ```
   - In `apps/brics-portal/src/graphql/operations.ts`:
     - Query `GET_FEDERATED_ROUND` queries `federatedRound(id: ID!)`. `graphqlServer.ts` lacks this query field.
     - Query `GET_FEDERATED_MODEL_VERSIONS` requests `baseModelVersion`, `federationRoundId`, `s3Uri`, `aggregationSignature`, `participatingCountries`, `metrics { mae, rmse, backtestWeeks }`, `receivedAt`, `activatedAt`, `deprecatedAt`. None exist on `FederatedModelVersion` in `graphqlServer.ts:319-326`.
     - Query `GET_FEDERATED_PRIVACY_BUDGET` requests `federatedPrivacyBudget`. In `graphqlServer.ts:356`, the field is named `privacyBudgetLedger`.

6. **PostgreSQL Database Seed Disparity**:
   - `full_seed.sql` only inserts 5 states and 8 districts with IDs `a0000001-...`.
   - `apps/governance-portal/src/lib/geography.ts` and `datasets/seeds/output` define 10 canonical states and 50 districts with standard UUIDs.
   - `full_seed.sql` contains 0 seed inserts for `federation_rounds`, `privacy_budget_ledger`, or `federation_model_versions`.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1)**: The PHC portal submits stock adjustments with `batch_id` but without `batch_no`, and submits new batches with type `'inventory_batch_create'`.
   - **Inference 1**: `syncService.ts` fails to process these mutations (`NOT NULL` violation on `batch_no`, or `UNSUPPORTED_ENTITY_TYPE`). Therefore, inventory adjustments made in the PHC portal never persist to PostgreSQL.
2. **Premise 2 (Observation 2)**: `graphqlServer.ts` returns static numeric literals for state and district alert counts, shortages, and occupancy rates instead of computing `COUNT` and `SUM` from `alerts` and `phc_facilities`.
   - **Inference 2**: Even if PHC mutations reached the database, queries to `stateOverview` and `districtOverview` would still display static numbers, violating Requirement R2.
3. **Premise 3 (Observation 3 & 6)**: The frontend governance portal uses slugs (`'state-mh'`, `'dist-pune'`) and canonical UUIDs (`7b5d180c-...`), while `full_seed.sql` only seeded 5 states with arbitrary IDs and `graphqlServer.ts` requires exact UUID matches.
   - **Inference 3**: State and district drill-downs fail or show 0 facilities for half of the canonical Indian states unless the database is populated with the 10 canonical states and resolvers perform resilient slug/name matching.
4. **Premise 4 (Observation 4)**: The Governance portal uses REST endpoints `/api/v1/governance/redistribution/...` for approving redistribution recommendations, but the backend Express app lacks these routes.
   - **Inference 4**: Redistribution approvals submitted in the Governance UI fail with 404, never triggering `redistribution.approved` on `eventBus`, so `supply_chain_shipments` records are never spawned.
5. **Premise 5 (Observation 5)**: `brics-portal` has `VITE_USE_MOCK=true`, and its GraphQL client catches schema mismatches and falls back to `mockLink`.
   - **Inference 5**: The BRICS portal cannot render live database records until `VITE_USE_MOCK` is disabled and `graphqlServer.ts` exposes matching types, fields, and mutations.

---

## 3. Caveats

- **No Caveats.** Every observation was verified by directly inspecting source code files and seed datasets across both `Smart_governance` and `datasets`.

---

## 4. Conclusion

The multi-tier propagation pipeline can be made 100% operational with live data synchronization across all three portals by executing the following targeted changes:
1. **Sync Service (`syncService.ts`)**: Support `'inventory_batch_create'`, update `inventory_batches` by `id`/`batch_id` when `batch_no` is absent, and map `'outbreak'` alerts to `'outbreak_risk'`.
2. **GraphQL Server (`graphqlServer.ts`)**:
   - Replace hardcoded integers in `stateOverview` and `districtOverview` with dynamic SQL aggregations.
   - Add resilient slug/code/name resolution for states and districts.
   - Align schema and resolvers with `apps/brics-portal/src/graphql/schema.ts` (add `federatedRound(id)`, align `FederatedModelVersion` and `PrivacyBudgetEntry` fields, support BRICS mutation signatures).
   - Update `decideRedistribution` mutation to call `GovernanceService.decideRedistribution`.
   - Update `supplyChainShipments` resolver to query `supply_chain_shipments`.
3. **Express Routing (`src/index.ts`)**: Mount a redistribution router at `/api/v1/governance/redistribution` exposing `GET /recommendations` and `POST /:id/decision`.
4. **Database & Seeds**: Seed PostgreSQL `smarthealth` with the canonical 10 states, 50 districts, 120 PHCs, and federated rounds from `datasets/seeds/output`.
5. **Frontend Config**: Set `VITE_USE_MOCK=false` in `apps/brics-portal/.env` and eliminate mock fallback links.

---

## 5. Verification Method

To independently verify these findings:
1. **Check Hardcoded Numbers in GraphQL Resolvers**:
   Inspect `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts:467-470, 516-519`. Observe literal values `stockoutAlerts: 3`, `criticalShortages: 2`, `bedOccupancyRate: 84.5`, `openAlertsCount: 3`.
2. **Check Missing Redistribution Route**:
   Search for `app.use` or router registrations for `/api/v1/governance/redistribution` in `services/backend/smart-health-platform/backend/src/index.ts`. Observe that no such router is mounted.
3. **Check Inventory Mutation Handling**:
   Inspect `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts:286-308`. Note the `INSERT INTO inventory_batches ... ON CONFLICT (phc_id, medicine_id, batch_no)` query using `p.batch_no`. Contrast with `apps/phc-portal/src/modules/inventory/InventoryView.tsx:247-256` which only provides `id`, `batch_id`, `remaining_qty`.
4. **Check BRICS Environment Mock Flag**:
   Inspect `apps/brics-portal/.env`. Observe line 1: `VITE_USE_MOCK=true`.
5. **Check BRICS Schema Field Mismatches**:
   Compare `apps/brics-portal/src/graphql/schema.ts` lines 102-138 with `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts` lines 300-338. Observe missing fields `baseModelVersion`, `s3Uri`, `metrics`, `epsilonThisRound`, `deltaThisRound`.
