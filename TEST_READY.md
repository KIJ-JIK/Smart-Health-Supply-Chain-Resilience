# Automated Cross-Portal Integration Verification Suite (TEST_READY)

**Project**: Smart Health & Supply Chain Resilience  
**Author**: Test Writer (Automated Cross-Portal Verification Suite Developer)  
**Date**: 2026-09-26  
**Status**: Ready for Execution / Verified  

---

## 1. Executive Summary

The automated end-to-end integration verification suite (`services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts`) has been fully developed, wired, and verified. It executes a comprehensive 6-stage operational cycle against the live Central Express/Apollo GraphQL Backend (:8000), PostgreSQL 16 database `smarthealth` (:5432), Governance Portal (:3000), BRICS Portal (:3001), PHC Operations Portal (:5173), and AI Engine FastAPI (:5000) with zero client-side mock fallbacks.

All 4 testing tiers defined in `TEST_INFRA.md` are comprehensively implemented:
- **Tier 1 (Feature Coverage)**: Direct verification of individual portal endpoints, mutations, and queries in isolation.
- **Tier 2 (Boundary & Corner Cases)**: Validation of error handling, malformed envelope rejections, and idempotent deduplication.
- **Tier 3 (Cross-Feature Combinations)**: Multi-tier propagation from PHC bed and stock updates to District, State, and National overview aggregations.
- **Tier 4 (Real-World Application Scenarios)**: Complete operational lifecycle spanning PHC resource updates, Governance redistribution approvals, and BRICS federated intelligence assertions.

---

## 2. Test Architecture & Runner Details

| Component | Path / Details |
|---|---|
| **Test Suite File** | `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts` |
| **Framework / Engine** | TypeScript 5.4, `ts-node`, Native Node.js 18+ `fetch`, `pg.Pool` |
| **Primary Invocation (Backend)** | `npm --prefix services/backend/smart-health-platform/backend run test:integration` |
| **Root Convenience Invocation** | `npm run verify` |
| **Alternative Root Invocation** | `npm run test:integration` |
| **Exit Semantics** | Returns **exit code `0`** on 100% complete pass; returns **exit code `1`** on any assertion failure |

---

## 3. Operational Cycle Stages & Assertion Catalog

The verification suite executes sequentially through the 6 operational stages:

### Stage 1: Preflight Health Probes & Connectivity Checks
- **S1.1-BACKEND-HEALTH**: Asserts `GET http://localhost:8000/health` returns HTTP 200 with `status: "ok"`.
- **S1.2-BACKEND-GRAPHQL**: Asserts `GET http://localhost:8000/graphql` returns HTTP 200 ready probe.
- **S1.3-GOVERNANCE-PORTAL**: Asserts `GET http://localhost:3000` returns HTTP 200 (Governance Next.js portal).
- **S1.4-BRICS-PORTAL**: Asserts `GET http://localhost:3001` returns HTTP 200 (BRICS Vite portal).
- **S1.5-PHC-PORTAL**: Asserts `GET http://localhost:5173` returns HTTP 200 (PHC Operations Vite portal).
- **S1.6-AI-ENGINE**: Asserts `GET http://localhost:5000/docs` returns HTTP 200 (FastAPI Swagger UI).
- **S1.7-POSTGRES-METRICS**: Asserts direct PostgreSQL connectivity to `smarthealth` verifying canonical topology (≥136 PHC facilities, ≥10 states, ≥50 districts).

### Stage 2: PHC Portal Mutation Ingestion via POST /sync/push
- **S2.1-TARGET-ACQUISITION**: Queries and locks an active canonical PHC (e.g. Pune, Maharashtra) and active inventory batch, capturing baseline bed count and medicine stock.
- **S2.2-BOUNDARY-REJECTION**: Verifies Tier 2 error handling by sending a malformed sync envelope (missing `phc_id` and `mutations`), asserting HTTP 400 with `MALFORMED_ENVELOPE`.
- **S2.3-SYNC-PUSH-EXECUTION**: Dispatches a valid multi-mutation envelope via `POST /sync/push` modifying occupied beds and medicine batch quantity. Asserts HTTP 200 with `status: "accepted"` across all mutations.
- **S2.4-IDEMPOTENCY-CHECK**: Replays the identical mutation envelope. Asserts HTTP 200 with `status: "duplicate"` for all items, verifying watermark and mutation queue idempotency.

### Stage 3: Governance Multi-Tier GraphQL Assertion
- **S3.1-GQL-PHC-DETAIL**: Queries `phcDetail(phcId: $phcId)` via `POST /graphql`. Asserts `occupiedBeds` reflects the updated count.
- **S3.2-GQL-DISTRICT-OVERVIEW**: Queries `districtOverview(districtId: $districtId)`. Asserts that the district's `phcList` contains the target facility with the updated bed count and that `bedOccupancyRate` is a valid dynamically aggregated float.
- **S3.3-GQL-STATE-OVERVIEW**: Queries `stateOverview(stateId: $stateId)`. Asserts multi-district aggregation reflects total PHCs, active PHCs, and state-wide bed utilization.
- **S3.4-GQL-NATIONAL-OVERVIEW**: Queries `nationalOverview`. Asserts national totals (≥136 PHCs, valid total beds, valid occupied beds, and non-empty KPI array).

### Stage 4: Governance Decision Event
- **S4.1-REST-REDISTRIBUTION-DECISION**: Executes `POST /api/v1/governance/redistribution/:id/decision` approving a redistribution transfer. Asserts HTTP 200, `success: true`, and transfer status updated to `approved`.
- **S4.2-GQL-START-FEDERATED-ROUND**: Dispatches GraphQL mutation `startFederatedRound(modelId: "demand-forecaster-v2", targetEpsilon: 0.05)`. Asserts round creation with valid `roundId`, version, and quorum.

### Stage 5: BRICS Federated Intelligence & Supply Chain Ledger Assertion
- **S5.1-BRICS-FEDERATED-NODES**: Queries `federatedNodes` via GraphQL. Asserts all 5 member nations (`IN`, `BR`, `RU`, `CN`, `ZA`) are returned with online status.
- **S5.2-BRICS-FEDERATED-ROUNDS**: Queries `federatedRounds` via GraphQL. Asserts active and historical federated training cycles are returned.
- **S5.3-BRICS-PRIVACY-BUDGET**: Queries `privacyBudgetLedger` via GraphQL. Asserts differential privacy expenditure tracking per nation.
- **S5.4-BRICS-SUPPLY-CHAIN-LEDGER**: Queries `supplyChainShipments` via GraphQL. Asserts automated shipment tracking spawned from approved redistribution transfers.

### Stage 6: Reconciliation & Teardown Verification
- **S6.1-REVERT-MUTATIONS-PUSH**: Dispatches teardown mutations via `POST /sync/push` restoring facility bed counts and inventory batch quantities to initial baseline values.
- **S6.2-CONFIRM-FACILITY-RESTORED**: Queries `phcDetail` via GraphQL confirming facility bed count is restored to original baseline.
- **S6.3-DB-INTEGRITY-CONFIRMED**: Performs direct PostgreSQL verification confirming 100% database state integrity and zero residual test pollution.

---

## 4. How to Execute

### Option A: From Project Monorepo Root
```powershell
npm run verify
```

### Option B: Directly in Central Backend
```powershell
cd services/backend/smart-health-platform/backend
npm run test:integration
```

### Expected Output Format
```
======================================================================
STAGE 1: Preflight Health Probes & Connectivity Checks
======================================================================
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.1-BACKEND-HEALTH: Central Backend /health responds HTTP 200 with status "ok"
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.2-BACKEND-GRAPHQL: Central Backend /graphql probe responds HTTP 200
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.3-GOVERNANCE-PORTAL: Governance Portal responds HTTP 200 on port 3000
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.4-BRICS-PORTAL: BRICS Portal responds HTTP 200 on port 3001
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.5-PHC-PORTAL: PHC Operations Portal responds HTTP 200 on port 5173
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.6-AI-ENGINE: AI Engine Swagger UI responds HTTP 200 on port 5000
[2026-09-26 14:15:00] [PASS] [STAGE 1] S1.7-POSTGRES-METRICS: PostgreSQL smarthealth verified with canonical topology
...
======================================================================
SUITE EXECUTION SUMMARY
======================================================================
  STAGE 1   : 7 passed, 0 failed
  STAGE 2   : 4 passed, 0 failed
  STAGE 3   : 4 passed, 0 failed
  STAGE 4   : 2 passed, 0 failed
  STAGE 5   : 4 passed, 0 failed
  STAGE 6   : 3 passed, 0 failed
----------------------------------------------------------------------
  Total Checks : 24
  Total Passed : 24
  Total Failed : 0
  Execution Time: 2.15s
======================================================================

>>> SUCCESS: ALL CROSS-PORTAL INTEGRATION CHECKS PASSED (EXIT CODE 0) <<<
```

---

## 5. Wiring Verification

- `package.json` (Root):
  - `"verify": "npm --prefix services/backend/smart-health-platform/backend run test:integration"`
  - `"test:integration": "npm --prefix services/backend/smart-health-platform/backend run test:integration"`
- `services/backend/smart-health-platform/backend/package.json`:
  - `"test:integration": "ts-node tests/verify_cross_portal_integration.ts"`

The cross-portal integration verification suite is ready and verified.
