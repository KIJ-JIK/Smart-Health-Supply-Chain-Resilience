# Multi-Tier Data Propagation & Backend Architecture Survey Report
**Author:** Explorer 2 (Backend, Schema & Propagation Pipeline Investigator)  
**Date:** 2026-09-26  
**Workspace:** `C:\Users\anshv\OneDrive\Desktop\Smart_governance`  
**Target Runtime:** `services/backend/smart-health-platform/backend` (Port 8000), PostgreSQL (`smarthealth`)

---

## 1. Executive Summary

This investigation conducted a comprehensive, line-by-line inspection of the backend services, GraphQL schemas, Express routers, PostgreSQL database schemas, seed configurations, and cross-portal contracts across the PHC Portal (`apps/phc-portal`), Governance Portal (`apps/governance-portal`), and BRICS Portal (`apps/brics-portal`).

### Core Finding
The system features sophisticated domain modules (FEFO billing, event-driven supply chain tracking, hash-chained federated learning), but the **multi-tier live propagation pipeline is broken in multiple critical links**:
1. **PHC → Database**:
   - Stock adjustments from `InventoryView.tsx` omit `batch_no`, causing `INSERT ... ON CONFLICT (phc_id, medicine_id, batch_no)` in `syncService.ts` to fail with a PostgreSQL `NOT NULL` constraint violation.
   - Batch creation enqueued as `inventory_batch_create` triggers `UNSUPPORTED_ENTITY_TYPE` because `syncService.ts` lacks a handler.
   - Emergency alert mutations enqueue `alert_type: 'outbreak'`, which is coerced to `'emergency_report'`, disconnecting it from Governance queries.
2. **Database → Governance Portal**:
   - `stateOverview` and `districtOverview` resolvers in `graphqlServer.ts` return **hardcoded constants** (`stockoutAlerts: 3`, `criticalShortages: 2`, `bedOccupancyRate: 84.5`, `openAlertsCount: 3`), completely ignoring live mutations.
   - `stateOverview` and `districtOverview` fail or return 0 facilities when string slugs (e.g., `'state-mh'`, `'dist-pune'`) are passed because resolvers perform strict UUID matching (`WHERE id = $1`).
   - `full_seed.sql` only populated 5 states and 15 PHCs, while `apps/governance-portal/src/lib/geography.ts` and `datasets/seeds/output` define the canonical 10 states, 50 districts, and 120 PHCs.
3. **Governance Portal → Database → BRICS Portal**:
   - Approving redistribution recommendations in `apps/governance-portal/src/app/redistribution/page.tsx` calls `POST /api/v1/governance/redistribution/:id/decision`. **No Express route exists** for this path.
   - In `graphqlServer.ts`, the `decideRedistribution` mutation does not publish `redistribution.approved` on `eventBus`, so `SupplyChainService` never creates tracking shipments.
   - `apps/brics-portal/.env` has `VITE_USE_MOCK=true`.
   - The GraphQL schema in `graphqlServer.ts` diverges drastically from `apps/brics-portal/src/graphql/schema.ts` and `operations.ts` (missing singular `federatedRound(id)`, missing fields on `FederatedModelVersion` and `PrivacyBudgetEntry`, mismatched mutation signatures).
   - In `full_seed.sql`, `federation_rounds`, `privacy_budget_ledger`, and `federation_model_versions` are empty dummy tables without the canonical seed records from `datasets/seeds/output`.

---

## 2. Multi-Tier Data Propagation Pipeline Mapping

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: PRIMARY HEALTHCARE CENTRE (PHC)                                                      │
│  - Medicine Stock Adjustments (InventoryView.tsx)                                           │
│  - Bed Occupancy & Facility Updates (BedsView.tsx)                                          │
│  - Clinical & Outbreak Alerts (EmergencyModal.tsx)                                          │
│  - FEFO Medicine Dispensing (BillingView.tsx)                                               │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                           Offline Dexie Queue │ POST /sync/push
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ BACKEND SYNC INGESTION (services/backend/.../src/modules/sync)                              │
│  - syncController.ts -> syncService.ts (SyncService.processPush)                            │
│  - Idempotent transaction execution into mutation_queue                                     │
│  - Dispatches to domain handlers:                                                           │
│      * handleBillingMutation   -> BillingService.checkout()                                 │
│      * handleInventoryMutation -> inventory_batches                                         │
│      * handleFacilityMutation  -> phc_facilities (total_beds, occupied_beds, etc.)          │
│      * handleAlertMutation     -> alerts (phc_id, district_id, state_id)                    │
│      * handleRequestMutation   -> resource_requests                                         │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                               SQL INSERT/UPD  │ PostgreSQL smarthealth DB
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ POSTGRESQL CANONICAL REPOSITORY (smarthealth)                                               │
│  - Geography: states (10), districts (50), phc_facilities (120)                             │
│  - Operational: inventory_batches, alerts, resource_requests, staff_attendance              │
│  - Governance & Supply Chain: redistribution_transfers, supply_chain_shipments              │
│  - BRICS Ledger: federation_rounds, privacy_budget_ledger, federation_model_versions        │
└───────────────────────┬───────────────────────────────────────────────┬─────────────────────┘
                        │                                               │
       Live SQL Queries │ /graphql                                      │ EventBus Trigger
                        ▼                                               ▼
┌──────────────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ TIER 2: GOVERNANCE READ LAYER                    │ │ GOVERNANCE ACTIONS                     │
│  - NationalOverview (KPIs, bed occupancy, alerts)│ │  - Approve Redistribution:             │
│  - StateOverview (District rollups, beds, alerts)│ │    POST /api/v1/governance/            │
│  - DistrictOverview (PHC facility status, beds)  │ │         redistribution/:id/decision    │
│  - Medicine & Resource Intelligence              │ │  - Publishes: redistribution.approved  │
└──────────────────────────────────────────────────┘ └──────────────────┬─────────────────────┘
                                                                        │
                                                     SupplyChainService │ Spawns Shipment
                                                                        ▼
                                                     ┌────────────────────────────────────────┐
                                                     │ TIER 3: BRICS PORTAL INTELLIGENCE      │
                                                     │  - Supply Chain Ledger & Shipments     │
                                                     │  - Federated Nodes & Health            │
                                                     │  - Hash-Chained Training Rounds        │
                                                     │  - Differential Privacy Budget Ledger  │
                                                     │  - Global Aggregated Model Versions    │
                                                     └────────────────────────────────────────┘
```

---

## 3. Detailed Component-by-Component Trace & Gap Analysis

### 3.1 Tier 1: PHC Portal Mutations → PostgreSQL

#### File Locations Inspected:
- `apps/phc-portal/src/hooks/useSyncEngine.ts`
- `apps/phc-portal/src/hooks/useMutationQueue.ts`
- `apps/phc-portal/src/modules/inventory/InventoryView.tsx`
- `apps/phc-portal/src/modules/beds/BedsView.tsx`
- `apps/phc-portal/src/modules/emergency/EmergencyModal.tsx`
- `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts`
- `services/backend/smart-health-platform/backend/src/modules/sync/syncController.ts`

#### Observed Behavior & Discrepancies:
1. **Stock Adjustment Bug (`inventory_batch_update`)**:
   - `InventoryView.tsx:247-256` enqueues:
     ```json
     {
       "id": "adj-uuid",
       "batch_id": "batch-uuid",
       "medicine_id": "med-uuid",
       "previous_qty": 100,
       "remaining_qty": 150,
       "adjustment_delta": 50,
       "reason": "Physical count audit",
       "user_name": "Dr. Sharma"
     }
     ```
   - In `syncService.ts:293-308`, `handleInventoryMutation` attempts:
     ```sql
     INSERT INTO inventory_batches (
       phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (phc_id, medicine_id, batch_no) DO UPDATE ...
     ```
   - Because `p.batch_no` is undefined, PostgreSQL throws:  
     `null value in column "batch_no" of relation "inventory_batches" violates not-null constraint`.
   - **Remediation**: In `handleInventoryMutation`, if `p.batch_id` or `p.id` is present, execute:
     ```sql
     UPDATE inventory_batches
     SET remaining_qty = $1, updated_at = now()
     WHERE id = $2 AND phc_id = $3
     RETURNING id
     ```
2. **Missing Batch Receiving Handler (`inventory_batch_create`)**:
   - `InventoryView.tsx:214` enqueues `'inventory_batch_create'` when entering new medicine stock.
   - `syncService.ts:195` switch statement has no case for `'inventory_batch_create'`.
   - **Remediation**: Route `inventory_batch_create` to `handleInventoryMutation` or a dedicated creation handler that inserts the new batch into `inventory_batches`.
3. **Emergency Alert Mismatch (`alert_report`)**:
   - `EmergencyModal.tsx:22` sends `alert_type: 'outbreak'`.
   - `syncService.ts:433` defines `validAlertTypes` without `'outbreak'` (only `'outbreak_suspected'`). The type is coerced to `'emergency_report'`.
   - In `graphqlServer.ts:391`, `nationalOverview` queries `WHERE alert_type = 'outbreak_risk'`.
   - **Remediation**: Normalize incoming alert types: map `'outbreak'` to `'outbreak_risk'`, and in queries support `alert_type IN ('outbreak', 'outbreak_risk', 'outbreak_suspected')`.
4. **Bed Occupancy Propagation (`facility_update`)**:
   - `BedsView.tsx:50` enqueues `'facility_update'` with `{ total_beds, occupied_beds, emergency_beds, isolation_beds }`.
   - `syncService.ts:387` updates `phc_facilities`. This works correctly, but the updated bed numbers were NOT appearing on State and District overviews due to hardcoding in `graphqlServer.ts`.

---

### 3.2 Tier 2: Governance Portal Overview & Geography Mapping

#### File Locations Inspected:
- `apps/governance-portal/src/app/governance/page.tsx`
- `apps/governance-portal/src/lib/geography.ts`
- `apps/governance-portal/src/lib/apolloClient.ts`
- `apps/governance-portal/src/graphql/queries.ts`
- `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts`
- `services/backend/smart-health-platform/database/seeds/full_seed.sql`
- `datasets/seeds/output/01_states.json`, `02_districts.json`, `03_phc_facilities.json`

#### Observed Behavior & Discrepancies:
1. **Hardcoded Overviews in `graphqlServer.ts`**:
   - Lines 467-470 (`stateOverview`):
     ```typescript
     stockoutAlerts: 3,
     criticalShortages: 2,
     bedOccupancyRate: 84.5,
     criticalAlertsCount: 4,
     ```
   - Lines 516-519 (`districtOverview`):
     ```typescript
     stockoutAlerts: 2,
     pendingRequestsCount: 1,
     openAlertsCount: 3,
     ```
   - Line 502 (`districtOverview` PHC summary):
     ```sql
     1 AS "openAlerts"
     ```
   - Line 453 (`stateOverview` district summary):
     ```sql
     1 AS "stockoutRiskCount"
     ```
   - **Remediation**: Replace all static numbers with dynamic SQL aggregations against `alerts`, `phc_facilities`, `inventory_batches`, and `resource_requests`.
2. **State & District Identifier Resolution (Canonical 10 States)**:
   - When a user selects a state or district or visits the command center, `page.tsx` falls back to `'state-mh'` or `'dist-pune'`.
   - `graphqlServer.ts:444` executes `SELECT id, name FROM states WHERE id = $1`.
   - If `$1` is `'state-mh'`, PostgreSQL rejects the query or defaults to Maharashtra with ID `'state-mh'`, causing `WHERE d.state_id = 'state-mh'` to return 0 districts!
   - **Remediation**:
     Update state lookup to:
     ```sql
     SELECT id, name, code FROM states
     WHERE id::text = $1 OR code ILIKE $1 OR name ILIKE $1
        OR ($1 = 'state-mh' AND (code = 'MH' OR name ILIKE '%Maharashtra%'))
     LIMIT 1
     ```
     Update district lookup to:
     ```sql
     SELECT d.id, d.name, d.state_id, s.name AS state_name
     FROM districts d
     JOIN states s ON d.state_id = s.id
     WHERE d.id::text = $1 OR d.name ILIKE $1
        OR ($1 = 'dist-pune' AND d.name ILIKE '%Pune%')
     LIMIT 1
     ```
3. **Database Seed Deficiency (5 States vs 10 Canonical States)**:
   - `full_seed.sql` only inserts 5 states (MH, KA, TN, UP, RJ) and 8 districts with arbitrary IDs (`a0000001-...`).
   - `datasets/seeds/output` and `apps/governance-portal/src/lib/geography.ts` define 10 canonical states (AP, BR, GJ, KA, MP, MH, RJ, TN, UP, WB) and 50 districts with standard UUIDs.
   - **Remediation**: The database must have the complete 10-state, 50-district, 120-PHC canonical dataset seeded from `datasets/seeds/output` (or `seed.js`).

---

### 3.3 Tier 3: Governance Actions → DB → BRICS Portal Intelligence

#### File Locations Inspected:
- `apps/governance-portal/src/app/redistribution/page.tsx`
- `apps/governance-portal/src/lib/redistributionData.ts`
- `services/backend/smart-health-platform/backend/src/modules/governance/governanceService.ts`
- `services/backend/smart-health-platform/backend/src/modules/supplychain/supplyChainService.ts`
- `services/backend/smart-health-platform/backend/src/modules/supplychain/supplyChainController.ts`
- `apps/brics-portal/src/graphql/client.ts`
- `apps/brics-portal/src/graphql/schema.ts`
- `apps/brics-portal/src/graphql/operations.ts`
- `apps/brics-portal/.env`
- `services/backend/smart-health-platform/backend/src/modules/federation/federationService.ts`

#### Observed Behavior & Discrepancies:
1. **Missing REST Route for Redistribution Decisions**:
   - `apps/governance-portal/src/app/redistribution/page.tsx:60`:
     `POST /api/v1/governance/redistribution/:recommendationId/decision`
   - `apps/governance-portal/src/lib/redistributionData.ts:200`:
     `GET /api/v1/governance/redistribution/recommendations?district=...`
   - Neither REST endpoint exists in `services/backend/.../src/index.ts`.
   - When a user clicks "Approve Transfer" in the Governance Portal, the fetch receives HTTP 404.
   - **Remediation**: Add a router mounted at `/api/v1/governance/redistribution` that exposes:
     - `GET /recommendations` -> `GovernanceService.getRedistributionRecommendations`
     - `POST /:id/decision` -> `GovernanceService.decideRedistribution`
2. **Event-Bus & Supply Chain Disconnect**:
   - `graphqlServer.ts` has a GraphQL mutation `decideRedistribution`, but it only executes an SQL UPDATE on `redistribution_transfers`. It NEVER calls `GovernanceService.decideRedistribution` and NEVER emits `redistribution.approved` on `eventBus`.
   - As a result, `SupplyChainService.initEventSubscribers()` never triggers, and no tracking record is created in `supply_chain_shipments`.
   - Furthermore, `graphqlServer.ts:750` (`supplyChainShipments` resolver) queries `redistribution_transfers` instead of `supply_chain_shipments`.
   - **Remediation**:
     - Update `decideRedistribution` mutation in `graphqlServer.ts` to delegate to `GovernanceService.decideRedistribution` (or emit `redistribution.approved` on `eventBus`).
     - Update `supplyChainShipments` resolver to query `supply_chain_shipments`.
3. **BRICS Mock Fallback & Schema Incompatibility**:
   - In `apps/brics-portal/.env`: `VITE_USE_MOCK=true`.
   - In `apps/brics-portal/src/graphql/client.ts`: `forceMock ? mockLink : networkPipeline`.
   - In `apps/brics-portal/src/graphql/operations.ts`:
     - Query `GET_FEDERATED_ROUND($id: ID!)` calls `federatedRound(id: $id)`. `graphqlServer.ts` has no singular resolver.
     - Query `GET_FEDERATED_MODEL_VERSIONS` requests:
       `baseModelVersion`, `federationRoundId`, `s3Uri`, `aggregationSignature`, `participatingCountries`, `metrics { mae, rmse, backtestWeeks }`, `receivedAt`, `activatedAt`, `deprecatedAt`. None exist on `FederatedModelVersion` in `graphqlServer.ts`.
     - Query `GET_FEDERATED_PRIVACY_BUDGET` requests:
       `federatedPrivacyBudget { id, countryId, federationRoundId, epsilonThisRound, deltaThisRound, cumulativeEpsilon, budgetLimit, clipNorm, noiseMultiplier, localSampleCount, submitted, recordedAt }`.
       In `graphqlServer.ts`, the field is named `privacyBudgetLedger` with different subfields.
     - Mutations:
       - `startFederatedRound(config: StartRoundInput!)`: `graphqlServer.ts` expects `(modelId: String!, targetEpsilon: Float!)`.
       - `approveAggregatedModel(roundId: ID!)`: `graphqlServer.ts` returns `FederatedModelVersion` instead of `FederatedRound`.
       - `rejectAggregatedModel` and `toggleCountryParticipation` are completely missing.
   - **Remediation**:
     - Switch `VITE_USE_MOCK=false` in `apps/brics-portal/.env`.
     - Align `graphqlServer.ts` schema and resolvers with `apps/brics-portal/src/graphql/schema.ts` while maintaining backward compatibility for governance queries.
     - Seed `federation_rounds`, `privacy_budget_ledger`, and `federation_model_versions` with the canonical records from `datasets/seeds/output/24_*.json`, `25_*.json`, and `26_*.json`.

---

## 4. End-to-End Blueprint for Implementation Phase

### 4.1 Backend Service Changes (`services/backend/smart-health-platform/backend`)

#### 1. Sync Engine (`src/modules/sync/syncService.ts`)
- Add `'inventory_batch_create'` and `'equipment_update'` to `MutationInput.entity_type` and `executeMutation` switch.
- In `handleInventoryMutation`:
  - Check if `p.batch_id` or `p.id` is provided without `p.batch_no`. If so, execute an UPDATE on `inventory_batches` by ID.
  - If `p.batch_no` is present, execute the existing upsert.
  - Insert an audit entry into `stock_adjustments` / `stock_movements`.
- In `handleAlertMutation`:
  - Map `'outbreak'` or `'outbreak_suspected'` to `'outbreak_risk'`.

#### 2. Redistribution REST Controller (`src/modules/governance/redistributionController.ts`)
- Create new Express router:
  - `GET /api/v1/governance/redistribution/recommendations`:
    Calls `GovernanceService.getRedistributionRecommendations(req.tenantClaims, req.query.district)`.
  - `POST /api/v1/governance/redistribution/:id/decision`:
    Calls `GovernanceService.decideRedistribution(req.tenantClaims, req.params.id, req.body.decision, req.body.modifiedQuantity, req.body.notes)`.
- Mount in `src/index.ts`:
  `app.use('/api/v1/governance/redistribution', redistributionRouter);`

#### 3. GraphQL Server (`src/modules/governance/graphqlServer.ts`)
- **Schema Updates**:
  - Add `federatedRound(id: ID!): FederatedRound` to `Query`.
  - Add alias `federatedPrivacyBudget: [PrivacyBudgetEntry!]!` to `Query`.
  - Update `FederatedModelVersion`, `FederatedRound`, and `PrivacyBudgetEntry` types to include all fields required by `apps/brics-portal/src/graphql/schema.ts`.
  - Update mutations:
    - Support `startFederatedRound(config: StartRoundInput, modelId: String, targetEpsilon: Float): FederatedRound!`
    - Support `approveAggregatedModel(roundId: ID!, targetVersion: String): FederatedRound!`
    - Add `rejectAggregatedModel(roundId: ID!, reason: String!): FederatedRound!`
    - Add `toggleCountryParticipation(countryCode: String!, enabled: Boolean!): FederatedNode!`
- **Resolver Updates**:
  - `stateOverview`:
    - Resilient lookup by UUID, code, or name (`state-mh` -> Maharashtra).
    - Dynamic calculation of `bedOccupancyRate` from `phc_facilities`.
    - Dynamic calculation of `stockoutAlerts`, `criticalShortages`, and `criticalAlertsCount` from `alerts`.
    - Dynamic calculation of `stockoutRiskCount` per district.
  - `districtOverview`:
    - Resilient lookup by UUID, code, or name (`dist-pune` -> Pune).
    - Dynamic calculation of `stockoutAlerts`, `openAlertsCount`, and `pendingRequestsCount`.
    - Dynamic calculation of per-PHC `openAlerts` from `alerts`.
  - `decideRedistribution`:
    - Delegate to `GovernanceService.decideRedistribution` to trigger `redistribution.approved` on `eventBus`.
  - `supplyChainShipments`:
    - Query `supply_chain_shipments` table with fallback to `redistribution_transfers`.
  - Federated resolvers:
    - `federatedRound(args: { id: string })`: Return single round from `federation_rounds`.
    - `federatedPrivacyBudget`: Return ledger entries matching BRICS shape.
    - `federatedModelVersions`: Return versions matching BRICS shape.

#### 4. Database Population & DDL
- Ensure tables `federation_rounds`, `privacy_budget_ledger`, `federation_model_versions`, and `supply_chain_shipments` have all columns from `05_brics_federated.sql` and `10_supply_chain_shipments.sql`.
- Load canonical seed data from `datasets/seeds/output` (10 states, 50 districts, 120 PHCs, 24 rounds, 25 budget entries, 26 model versions).

### 4.2 Frontend Portal Configuration Changes

#### 1. BRICS Portal (`apps/brics-portal`)
- In `.env`: Change `VITE_USE_MOCK=false`.
- In `src/graphql/client.ts`: Ensure `mockLink` is disabled when connected to live backend; remove silent fallback to fake data when queries succeed.

#### 2. Governance Portal (`apps/governance-portal`)
- In `src/lib/apolloClient.ts`: Confirm `useMock` evaluates to `false` when `NEXT_PUBLIC_USE_MOCK` is not `'true'`.
- In `src/lib/redistributionData.ts` and `src/app/redistribution/page.tsx`: Confirm REST fetch calls hit `/api/v1/governance/redistribution/...` and receive 200 responses.

#### 3. PHC Portal (`apps/phc-portal`)
- Ensure `useSyncEngine.ts` maintains `useLiveServer = true` and pushes mutations to `http://localhost:8000/sync/push`.
- In `BillingView.tsx:164`: Replace hardcoded `'phc-varanasi-rampur-001'` with dynamic `getCurrentPhcId()` to avoid foreign key errors.

---

## 5. Integration Verification Script Specification

Per Requirement R3, the implementer must author an automated end-to-end integration test script (`test_propagation_pipeline.js` or `.ts`) executing:
1. **Step 1: Baseline Read**:
   - Query `nationalOverview` and `stateOverview(stateId: "Maharashtra")` via GraphQL.
   - Record initial bed occupancy, stockout alerts, and facility counts.
2. **Step 2: PHC Mutation Ingestion**:
   - Send `POST /sync/push` with:
     - `inventory_batch_update`: Adjust Paracetamol stock to 12 units.
     - `facility_update`: Update occupied beds from 27 to 29.
     - `alert_report`: Submit a new critical outbreak alert.
   - Assert HTTP 200 and `results[i].status === 'accepted'`.
3. **Step 3: Governance Reflection**:
   - Query `stateOverview` and `districtOverview`.
   - Assert occupied beds increased by 2.
   - Assert open alert count increased by 1.
   - Assert stock adjustment reflects in `medicineIntelligence`.
4. **Step 4: Governance Decision**:
   - Call `POST /api/v1/governance/redistribution/:id/decision` with `{ decision: "approved" }`.
   - Assert HTTP 200.
5. **Step 5: Supply Chain & BRICS Reflection**:
   - Query `supplyChainShipments` and assert a new shipment is in `approved` or `in_transit` status.
   - Execute `startFederatedRound` GraphQL mutation.
   - Query `federatedRounds` and assert the new round is present in the hash chain.
   - Exit with code 0 on complete assertion pass.

---

## 6. Conclusion
The path to complete end-to-end live propagation is clear and tractable. By fixing the inventory mutation handler in `syncService.ts`, replacing hardcoded overview values in `graphqlServer.ts` with real SQL aggregations, adding the redistribution REST endpoints, and aligning the GraphQL schema with the BRICS portal, the entire multi-tier system will achieve seamless live synchronization.
