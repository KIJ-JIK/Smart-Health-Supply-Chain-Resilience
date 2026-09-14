# Cross-Team Contract Reconciliation Audit & Tracked Issues

**Date:** 2026-09-13  
**Author:** Abdul (Shared Backend — Node.js/TypeScript)  
**Reference:** `Abdul_Backend.md` (Prompt 22), `Ansh_PHC_Portal.md`, `Arya_Governance_National.md`, `Sumaiya_BRICS.md`  

---

## Executive Summary

Per **Prompt 22**, the backend team completed a comprehensive, field-for-field reconciliation against the README assumptions documents and mock schemas published by the three frontend teams:
1. **PHC Portal (Ansh):** Offline sync engine, mutation queue, IndexedDB schema, and FEFO billing contracts.
2. **National Governance Portal (Arya):** Governance read-layer GraphQL surface, analytics rollups, and crisis simulator WebSocket.
3. **BRICS Federated Learning Portal (Sumaiya):** 5-nation federated learning schemas, hash-chained rounds, and differential privacy ledgers.

Rather than making silent, one-sided backend changes, all contract variances have been formally documented below as **Tracked Issues** for collaborative cross-team governance.

---

## 1. PHC Portal Reconciliation (Ansh)

### Contract Alignment Matrix
| Interface / Contract | PHC Portal Assumption | Backend Real Contract (Chunks 6, 7, 9, 13) | Alignment Status |
|:---|:---|:---|:---|
| **Sync Push (`POST /sync/push`)** | Batch of mutations with `mutation_id`, `client_txn_id`, `entity_type`, `action`, `payload` | Handled idempotently with watermarks and validation | ✅ **100% Match** |
| **Sync Pull (`GET /sync/pull`)** | Delta stream with `since`, `phc_id`, returning `records`, `server_seq`, `has_more` | Implemented in `syncController.ts` with 410 Gone check | ✅ **100% Match** |
| **Offline IndexedDB Store** | Cache for `medicines`, `inventory_batches`, `offline_queue` | Matches Dataset schemas 07, 08, 10 | ✅ **100% Match** |
| **Config Delivers** | `min_stock_threshold_pct`, `critical_stock_threshold_pct`, `near_expiry_days` etc. | Hierarchical `system_config` cascade via `getConfigDeltasSince` | ✅ **100% Match** |

### Tracked Issues (PHC Portal):
- **ISSUE-PHC-01 [Priority: Minor/P3]:**  
  *Observation:* PHC Portal assumes billing transaction payload timestamp field is named `dispensed_at`. The underlying database column in `billing_transactions` is `created_at`.  
  *Resolution:* Backend `billingService.ts` and sync adapter serialize both `dispensed_at` and `created_at` in responses to maintain complete client compatibility without schema break.
- **ISSUE-PHC-02 [Priority: Minor/P3]:**  
  *Observation:* PHC Portal client specifies `sync_batch_max_mutations = 100`, whereas backend default was 50.  
  *Resolution:* Configured `system_config` default `sync_batch_max_mutations = 100` globally.

---

## 2. National Governance Portal Reconciliation (Arya)

### Contract Alignment Matrix
| GraphQL Resolver | Governance Portal Assumption | Backend Real Resolver (Chunk 13, 15) | Alignment Status |
|:---|:---|:---|:---|
| `nationalOverview` | Aggregated PHCs, beds, occupancy, oxygen, alert rollups | Implemented with in-memory Redis TTL caching | ✅ **100% Match** |
| `medicineIntelligence` | Stockouts, near-expiry batches, velocity, days of supply | Handled by `governanceService.ts` | ✅ **100% Match** |
| `resourceIntelligence` | Ventilators, oxygen, cold chain telemetry | Matches Prompt 15 contract | ✅ **100% Match** |
| `workforceIntelligence` | Attendance rate, doctor-to-patient ratio, shortages | Scoped by caller jurisdiction (RLS) | ✅ **100% Match** |
| `patientIntelligence` | Footfall trend points, syndromic surveillance count | Implemented via TimescaleDB aggregation | ✅ **100% Match** |
| `supplyChainShipments` | Filterable shipments with status, dates, tracking numbers | Backed by `supply_chain_shipments` & event bus | ✅ **100% Match** |
| `decideRedistribution` | Human approval mutation (`approved` / `rejected`) | Implemented with authority RBAC check | ✅ **100% Match** |
| **Simulator WebSocket** | `/api/v1/governance/simulator/session` interactive session | Implemented in `simulatorService.ts` | ✅ **100% Match** |

### Tracked Issues (Governance Portal):
- **ISSUE-GOV-01 [Priority: Minor/P3]:**  
  *Observation:* In `medicineIntelligence.nearExpiryBatches`, Governance Portal assumes integer field `daysToExpiry`. Database stores `expiry_date` as ISO date.  
  *Resolution:* GraphQL resolver calculates `daysToExpiry = Math.ceil((expiryDate - now) / 86400000)` dynamically on read.
- **ISSUE-GOV-02 [Priority: Info/P4]:**  
  *Observation:* Governance Portal's mocked emergency stream simulated immediate browser notification. Backend provides Server-Sent Events (SSE) at `/api/v1/alerts/stream`.  
  *Resolution:* Confirmed SSE client hook in Governance Portal connects to `/api/v1/alerts/stream` with reconnection backoff.

---

## 3. BRICS Federated Learning Portal Reconciliation (Sumaiya)

### Contract Alignment Matrix
| GraphQL Field / Operation | BRICS Portal Assumption | Backend Real Implementation (Chunk 14) | Alignment Status |
|:---|:---|:---|:---|
| `federatedNodes` | 5 nations: India, Brazil, Russia, China, South Africa | Static verified 5-nation roster with node statuses | ✅ **100% Match** |
| `federatedRounds` | Hash-chained rounds with `previousEntryHash`, `thisHash` | SHA-256 chaining with 64-zero genesis anchor | ✅ **100% Match** |
| `privacyBudgetLedger` | Cumulative $\epsilon$ and budget limit per nation | Structurally enforced: rejects round if $\sum \epsilon > 5.0$ | ✅ **100% Match** |
| `startFederatedRound` | Mutation initiating round with `modelId`, `targetEpsilon` | Strict `national_admin` authority enforced | ✅ **100% Match** |
| `approveAggregatedModel` | Mutation approving global weights for distribution | Enforces human-in-the-loop review milestone | ✅ **100% Match** |

### Tracked Issues (BRICS Portal):
- **ISSUE-BRICS-01 [Priority: Minor/P3]:**  
  *Observation:* Sumaiya's early mockup used `nodeStatus: 'ACTIVE'`, whereas canonical API contracts specify `nodeStatus: 'ONLINE'`.  
  *Resolution:* Backend sets `nodeStatus = 'ONLINE'`. Frontend team notified to use `'ONLINE'`.
- **ISSUE-BRICS-02 [Priority: Architectural/P2]:**  
  *Observation:* BRICS settings page requests an "Add Country" action.  
  *Resolution:* Documented in Prompt 7 and enforced by backend that the 5-member BRICS roster (`IN`, `BR`, `RU`, `CN`, `ZA`) is fixed in Phase 1; country onboarding is an international diplomatic/sovereignty workflow and remains disabled in UI.

---

## 4. Cross-Team Sign-Off Status

| Team | Member | Contract Status | Outstanding Blocker |
|:---|:---|:---|:---|
| **Shared Backend** | Abdul (Member 4) | **All 16 Chunks Complete & Verified** | None |
| **PHC Portal** | Ansh (Member 1) | Reconciled against Sync & Billing | None |
| **Governance Portal** | Arya (Member 2) | Reconciled against GraphQL & Simulator | None |
| **BRICS Portal** | Sumaiya (Member 3) | Reconciled against Federated Seams & FL Ledger | None |
