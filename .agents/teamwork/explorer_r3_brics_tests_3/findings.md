# Comprehensive Investigation Report: AURA Sovereign (BRICS Portal :3001) & E2E Testing / Audit Readiness

**Author:** Explorer 3 (BRICS Portal & E2E Testing)  
**Date:** 2026-09-26  
**Target Working Directory:** `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_brics_tests_3`  
**Parent Agent:** orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

---

## Executive Summary
This investigation conducted a full-depth, read-only architectural and operational analysis of:
1. **AURA Sovereign (`apps/brics-portal` running on port 3001)**: Sovereign enclave telemetry across the 5 BRICS nations (India, Brazil, Russia, China, South Africa), the interactive 5-country federated training simulation engine, the human-in-the-loop candidate model review gate (`/review`), and the differential privacy monotonic ledger bounds ($\epsilon \le 5.0$).
2. **E2E Testing & Audit Readiness (`services/backend/smart-health-platform/backend/tests/`)**: Current automated test coverage against requirements R1, R2, R3, R4, and R5, identifying critical gaps and specifying the exact runner additions needed to generate the comprehensive markdown audit report with pass/fail telemetry, HTTP statuses, and DB query counts.

---

## Part 1: AURA Sovereign (`apps/brics-portal` :3001) Deep Dive

### 1. Architecture & Network Wiring
- **Application Structure**: Vite SPA React 18 + TypeScript + Tailwind CSS with Apollo Client (`@apollo/client` v3.11.0).
- **GraphQL Client Connection**: `apps/brics-portal/src/graphql/client.ts` (lines 10-38) connects directly to `http://localhost:8000/graphql` via `HttpLink`.
- **Zero Mock Links**: `apps/brics-portal/src/components/providers/ApolloWrapper.tsx` (lines 8-11) injects `apolloClient` directly. All mock fallbacks, `SchemaLink`, and in-memory resolvers from earlier prototypes are completely inactive.
- **Route Topology** (`apps/brics-portal/src/App.tsx`, lines 35-46):
  - `/login`: Country persona sign-in (`LoginPage.tsx`)
  - `/`: Command Center Overview (`OverviewPage.tsx`)
  - `/nodes`: Sovereign Enclave Registry & Diagnostics (`NodesPage.tsx`)
  - `/rounds`: Federated Training Rounds & Pipeline (`RoundsPage.tsx`)
  - `/review` and `/rounds/review`: Human-in-the-Loop Model Review Gate (`RoundReviewPage.tsx`)
  - `/lineage`: Model Version Lineage DAG (`LineagePage.tsx`)
  - `/privacy`: Differential Privacy & Cryptographic Ledger (`PrivacyPage.tsx`)
  - `/settings`: Federation Coordinator Settings (`SettingsPage.tsx`)
  - Cross-Portal Navigation (`Header.tsx`, lines 85-106): Smooth external switcher links to AURA Vantage (`:3000`) and AURA Point (`:5173`).

---

### 2. Sovereign Enclave Telemetry (India, Brazil, Russia, China, South Africa)

#### A. Node Specifications & Personas
Defined in `apps/brics-portal/src/store/auth-store.ts` (lines 13-97) and `apps/brics-portal/src/components/common/CountryNodeCard.tsx`:
1. **India (IN)**:
   - Enclave: Varanasi Enclave (`IN-01`)
   - Organization: Indian Council of Medical Research (ICMR) & MoHFW
   - Delegate Persona: Sumaiya Khan (`sumaiya.khan@smarthealth.gov.in`, `national_admin`)
   - Telemetry Baseline: 1.42M records, 24ms network latency, $\epsilon = 1.24$
2. **Brazil (BR)**:
   - Enclave: São Paulo Enclave (`BR-01`)
   - Organization: Oswaldo Cruz Foundation (Fiocruz) & SUS
   - Delegate Persona: Dr. Carlos Silva (`carlos.silva@fiocruz.br`, `national_admin`)
   - Telemetry Baseline: 890k records, 142ms network latency, $\epsilon = 1.45$
3. **Russia (RU)**:
   - Enclave: Moscow Enclave (`RU-01`)
   - Organization: Rospotrebnadzor & Federal Research Institute
   - Delegate Persona: Dr. Elena Rostova (`elena.rostova@rospotrebnadzor.ru`, `national_admin`)
   - Telemetry Baseline: 620k records, 98ms network latency, $\epsilon = 1.18$
4. **China (CN)**:
   - Enclave: Shanghai Enclave (`CN-01`)
   - Organization: Chinese Center for Disease Control and Prevention (CCDC)
   - Delegate Persona: Prof. Wei Zhang (`wei.zhang@chinacdc.cn`, `national_admin`)
   - Telemetry Baseline: 2.10M records, 65ms network latency, $\epsilon = 1.30$
5. **South Africa (ZA)**:
   - Enclave: Cape Town Enclave (`ZA-01`)
   - Organization: National Institute for Communicable Diseases (NICD)
   - Delegate Persona: Thabo Mthembu (`thabo.mthembu@nicd.ac.za`, `national_admin`)
   - Telemetry Baseline: 410k records, 185ms network latency, $\epsilon = 1.50$

#### B. Component Telemetry & Diagnostics
- In `apps/brics-portal/src/pages/NodesPage.tsx` (lines 104-172):
  - Fetches live telemetry using `GET_FEDERATED_NODES`, `GET_FEDERATED_ROUNDS`, and `GET_FEDERATED_PRIVACY_BUDGET`.
  - Computes ground data volume, cumulative privacy expenditure ($\epsilon$), round convergence curve, and cryptographic submission logs (weight delta hash, sample count, verification status).
  - Provides interactive sovereign toggle participation modal triggering `TOGGLE_COUNTRY_PARTICIPATION` mutation (lines 92-102).
  - Backed in `graphqlServer.ts` (lines 1020-1053) by querying the PostgreSQL `nations` table with graceful fallback to canonical 5-nation online definitions.

---

### 3. Interactive 5-Country Federated Training Simulation Engine

#### A. Architecture & Flow
- **Component**: `apps/brics-portal/src/components/rounds/StartRoundModal.tsx` and `apps/brics-portal/src/pages/RoundsPage.tsx`.
- **4-Stage Interactive Simulation Pipeline** (`StartRoundModal.tsx`, lines 69-121):
  1. **Stage 1 (0–1000ms): Dispatching Architecture**: Target model architecture (e.g., `v1.21-resilience-transformer`) dispatched simultaneously to all 5 sovereign enclaves.
  2. **Stage 2 (1000–2200ms): Local PyTorch Gradient Computation**: Enclaves compute local parameter deltas over local records with live progress bars:
     - 🇮🇳 Varanasi (45,200 records)
     - 🇧🇷 São Paulo (38,400 records)
     - 🇷🇺 Moscow (32,100 records)
     - 🇨🇳 Shanghai (51,800 records)
     - 🇿🇦 Cape Town (29,500 records)
  3. **Stage 3 (2200–3200ms): DP-SGD Noise & Central FedAvg Aggregation**: Local updates clipped to norm $C = 1.0$, Gaussian noise ($\sigma = 1.12$) injected, and encrypted deltas aggregated.
  4. **Stage 4 (3200–4200ms): Checkpoint Finalization & Handoff**: Round checkpoint generated with $+36.8\%$ forecasting accuracy gain. An animated call-to-action button appears: `"Go to Model Review Gate & Sign-Off"`, navigating seamlessly to `/review`.

#### B. Backend Cryptographic Hash Chaining
- In `services/backend/smart-health-platform/backend/src/modules/federation/federationService.ts`:
  - `startFederatedRound()` enforces SHA-256 hash chaining:
    $$\text{roundHash} = \text{SHA256}(\text{prevHash} + \text{roundNumber} + \text{modelId} + \text{startedAt})$$
  - Genesis round links to $\text{GENESIS\_HASH} = \text{'0'}^{64}$.
  - Inserts new round into PostgreSQL `federation_rounds` table with participating countries `['IN', 'BR', 'RU', 'CN', 'ZA']`.

---

### 4. Human-in-the-Loop Candidate Model Review Gate (`/review`)

#### A. Component Implementation
- Located in `apps/brics-portal/src/pages/RoundReviewPage.tsx` (508 lines).
- Accessible via two canonical routes: `/review` and `/rounds/review`.

#### B. Multi-Factor Gate Checks
1. **Forecast Accuracy Comparison** (`RoundReviewPage.tsx`, lines 290-329):
   - Compares candidate model against current active baseline:
     - **MAE**: Candidate $0.124$ vs Active $0.158$ ($-21.5\%$ error reduction)
     - **RMSE**: Candidate $0.189$ vs Active $0.231$ ($-18.2\%$ variance reduction)
     - **Forecast Horizon**: $12$ weeks vs $8$ weeks ($+50\%$ longer horizon)
2. **Sovereign Quorum Check** (lines 332-371):
   - Audits all 5 sovereign enclaves. Requires $\ge 4/5$ member countries to have submitted valid encrypted gradients.
3. **Differential Privacy Budget Consumption** (lines 374-382):
   - Displays `PrivacyBudgetGauge` and expands `PrivacyTechnicalDetails` audit table containing per-country $(\epsilon, \delta)$ values, noise multipliers ($\sigma = 1.12$), and clip norms ($C = 1.0$).
4. **Cryptographic Checkpoint Verification** (lines 386-424):
   - Verifies SHA-256 candidate model hash and signed S3 vault URI (`s3://brics-federation-vault/models/...`).

#### C. Operational Mutations
- **Authorize & Publish Global Model** (`APPROVE_AGGREGATED_MODEL`): Calls `approveAggregatedModel(roundId, targetVersion)` mutation, updating `federation_rounds.status = 'completed'` and `federation_model_versions.status = 'active'`.
- **Reject & Quarantine Round** (`REJECT_AGGREGATED_MODEL`): Prompts operator for governance justification (`ConfirmationDialog`), calls `rejectAggregatedModel(roundId, reason)` mutation, and marks round as `voided`.

#### D. Critical UI Observation & Gap
In `RoundReviewPage.tsx` lines 206 and 428:
```typescript
const isAwaitingReview = candidateRound.status === 'awaiting_review';
```
When `isAwaitingReview` is `false` (e.g. if the selected round has DB status `'training'`, `'started'`, or `'completed'`), the Authorize and Reject action buttons are suppressed, showing only a static status label `"Round Status: ..."` without interactive buttons.
- **Finding**: For user demonstration and simulation flows, when a round is started via `StartRoundModal.tsx`, either the backend round status should transition to `'awaiting_review'`, or `RoundReviewPage.tsx` should treat `'started'`, `'training'`, and `'awaiting_review'` as actionable candidate checkpoints.

---

### 5. Differential Privacy Monotonic Ledger Bounds ($\epsilon \le 5.0$)

#### A. Database Ledger & Seeding
- Table `privacy_budget_ledger` tracks: `id`, `country_id`, `round_number`, `epsilon_this_round`, `delta_this_round`, `cumulative_epsilon`, `budget_limit`, `clip_norm`, `noise_multiplier`, `local_sample_count`, `within_budget`, `recorded_at`.
- `services/backend/smart-health-platform/backend/src/db/seedPrivacyLedger.ts` seeds 20 realistic federated rounds across all 5 nations (100 rows total) with cumulative $\epsilon$ monotonically increasing up to $\approx 4.7$, strictly enforcing `budgetLimit = 5.0`.

#### B. Visualization Engine
- `apps/brics-portal/src/components/privacy/PrivacyBudgetChart.tsx`:
  - Renders multi-line SVG visualization tracking cumulative $\epsilon$ across rounds 1–20.
  - Features an explicit red-dashed barrier at `y = 5.0`:
    ```
    SOVEREIGN HARD CEILING (ε ≤ 5.0)
    ```
  - Displays Rényi DP Composition guarantees and per-country % of cap consumed.

#### C. Regulatory Cap Discrepancy Found (10.0 vs 5.0)
A critical inconsistency was discovered across the codebase regarding the differential privacy ceiling:
1. **User Requirement R4**: Explicitly mandates `checking ε ≤ 5.0 enforcement and ledger display`.
2. **Seed & Verification**: `seedPrivacyLedger.ts` and `PrivacyBudgetChart.tsx` use `5.0`.
3. **Backend Enforcement**: `FederationService.startFederatedRound()` (line 170) checks:
   ```typescript
   const budgetLimit = 5.0;
   if (currentMax + targetEpsilon > budgetLimit) {
     const err = new Error(`BUDGET_EXCEEDED: cumulative epsilon (${...}) exceeds structural privacy budget limit (${budgetLimit})`);
     (err as any).statusCode = 422;
     throw err;
   }
   ```
4. **Discrepant References to 10.0**:
   - `graphqlServer.ts` (line 1172): `COALESCE(budget_limit, 10.0)::float AS "budgetLimit"`
   - `FederationService.recordPrivacyBudget()` (line 275): `const budgetLimit = 10.0;`
   - `PrivacyPage.tsx` (lines 64, 255, 280): fallback `canonicalBudgetLimit = entries[0]?.budgetLimit ?? 10.0`, educational text `ε (Epsilon) ≤ 10.0`, and `breaches ε = 10.0`.
   - `PrivacyBudgetGauge.tsx` (line 17): default prop `budgetLimit = 10.0`.
   - `use-member-privacy-budget.ts` (line 36): fallback `budgetLimit = 10.0`.
- **Recommendation**: Standardize all fallback defaults and informational copy from `10.0` to `5.0` to strictly match the regulatory ceiling mandated by R4.

---

## Part 2: E2E Testing & Audit Readiness

### 1. Survey of Existing Backend Test Suite
The `services/backend/smart-health-platform/backend/tests/` directory contains 17 test files:

| File | Primary Focus | Scope |
|---|---|---|
| `verify_cross_portal_integration.ts` | 8-Stage operational E2E cycle | Live HTTP/GraphQL across Backend, Governance, BRICS, PHC, Gemini Vision, and Multilateral AI |
| `verify_all_portals_interconnected.ts` | Cross-portal data propagation | PHC mutation $\rightarrow$ Governance reflection $\rightarrow$ BRICS reflection |
| `test_chunk14_ai_brics.ts` | BRICS Federation & AI services | Hash chaining, genesis hash, privacy budget, national_admin RBAC |
| `test_new_google_ai_features.ts` | Google Gemini AI services | Prescription OCR, blister packaging OCR, BRICS EN/HI AI briefing |
| `test_m2_backend_pipeline.ts` | Backend GraphQL dynamic queries | Dynamic SQL rollups, slug resolution (`state-mh`, `dist-pune`), redistribution mutation |
| `test_facility_inventory.ts` | PHC bed metrics & inventory | Bed occupancy formulas, role policy split, stock adjustment thresholds |
| `test_billing_fefo.ts` | FEFO dispensing engine | Expiry sorting, cross-batch deduction, transaction idempotency |
| `test_sync_engine.ts` | Offline sync pipeline | Mutation batch ingestion, conflict detection, sequence numbering |
| `test_auth_device.ts` | Device security & JWT tokens | Device fingerprint binding, token refresh, multi-tenant claims |
| `test_rls_matrix.ts` | Row Level Security (RLS) | Multi-tenant isolation between facilities and jurisdictions |
| `test_api_contracts.ts` | REST endpoint validation | Status codes, schema validation via Zod |
| `test_chunk10_consumption_workforce_footfall.ts` | PHC operational metrics | Patient footfall, staff attendance, consumption velocity |
| `test_chunk11_requests_alerts.ts` | Clinical alerts & resource requests | Priority escalation, clinical incident reporting |
| `test_chunk12_event_catalog.ts` | In-memory / Kafka eventBus | Domain event publication and subscriber idempotency |
| `test_chunk13_governance_config.ts` | Governance configuration | Jurisdictions, threshold overrides, system parameters |
| `test_chunk15_supply_chain_audit.ts` | Supply chain shipment audit | Forensic audit logs, transfer lifecycle state transitions |
| `test_chunk16_observability_cross_team.ts` | Structured logging & metrics | Request latency histograms, correlation IDs |

---

### 2. Coverage Analysis Across Requirements (R1 – R5)

#### R1: Live Backend & PostgreSQL Integration Verification
- **User Mandate**: Verify all 3 portals query/mutate live PostgreSQL on `:8000`, validating 179 PHCs across 36 Indian states/UTs, facility drug inventories, transaction logs, and real-time streaming.
- **Current Coverage**:
  - `verify_cross_portal_integration.ts` (Stages 1-3) probes `/health`, `/graphql`, 36 States/UTs, and verifies live facilities and bed counts.
- **Coverage Status**: **90% Covered**.
- **Gap**: Missing live DB query counts in verification output and automated assertion for all 179 seeded PHC facilities.

#### R2: AURA Point (PHC Portal :5173) Live Verification & Stress Testing
- **User Mandate**: Staff authentication, prescription camera OCR with 3-key Google Gemini API pool, Dexie.js offline queueing, FEFO batch dispensing, and emergency incident reporting. Verify OCR multi-key rotation transparently handles quota/rate-limits without failing.
- **Current Coverage**:
  - `test_billing_fefo.ts` verifies FEFO batch allocation.
  - `test_sync_engine.ts` tests offline mutation batches.
  - `test_new_google_ai_features.ts` verifies prescription and blister pack OCR.
- **Coverage Status**: **70% Covered**.
- **Gap**: Missing automated stress test verifying transparent failover across the 3 Gemini API keys (`GEMINI_API_KEYS`) when an HTTP 429 quota error is triggered.

#### R3: AURA Vantage (Governance Command :3000) Live Testing & Route Diagnostics
- **User Mandate**: Test all 16 governance modules including GIS map layers (state boundaries & PHC pin density), crisis simulation parameters, AI stockout redistribution engine, real-time alert SSE stream, and jurisdiction management.
- **Current Coverage**:
  - `verify_cross_portal_integration.ts` (Stages 3 & 4) tests PHC, District, State, and National rollups and redistribution decision.
  - `test_chunk13_governance_config.ts` tests jurisdiction configurations.
- **Coverage Status**: **65% Covered**.
- **Gap**: Missing automated HTTP route diagnostic probe traversing all 16 Governance App Router sub-routes (`/national`, `/state`, `/district`, `/phc`, `/inventory`, `/redistribution`, `/gis`, `/crisis`, `/forecasting`, `/alerts`, `/workforce`, `/facilities`, `/simulation`, `/audit`, `/analytics`, `/settings`) to assert HTTP 200 and zero route exceptions.

#### R4: AURA Sovereign (BRICS Portal :3001) Federated AI Testing
- **User Mandate**: Sovereign enclave telemetry across India, Brazil, Russia, China, and South Africa; interactive 5-country federated training simulation engine; human-in-the-loop candidate model review gate (`/review`); differential privacy monotonic ledger bounds ($\epsilon \le 5.0$).
- **Current Coverage**:
  - `test_chunk14_ai_brics.ts` verifies `FederationService` hash chaining, round creation, and privacy budget insertion in a mock pool.
  - `verify_cross_portal_integration.ts` (Stage 5) queries `federatedNodes`, `federatedRounds`, and `privacyBudgetLedger`.
- **Coverage Status**: **75% Covered**.
- **Gap**:
  1. No automated test executes the Human-in-the-Loop review mutations (`approveAggregatedModel` and `rejectAggregatedModel`) against live PostgreSQL.
  2. No automated test tests `toggleCountryParticipation`.
  3. No automated test asserts that starting a round exceeding $\epsilon \le 5.0$ throws HTTP 422 `BUDGET_EXCEEDED`.

#### R5: Automated Fixes & Verification Audit Report
- **User Mandate**: Detect and automatically fix runtime errors, network timeouts, broken state transitions. Produce a comprehensive live audit report with pass/fail telemetry logs, exact HTTP statuses, and DB query counts.
- **Current Coverage**:
  - Existing scripts (`verify_cross_portal_integration.ts`, `verify_all_portals_interconnected.ts`) print ANSI output to stdout, but do NOT produce a structured markdown audit report file with DB query metrics.
- **Coverage Status**: **40% Covered**.
- **Gap**: A dedicated test harness runner (e.g. `audit_runner.ts`) is required to orchestrate all checks, record millisecond latencies, HTTP status codes, DB query counts, and generate a self-contained markdown report (`audit_report.md`).

---

## Part 3: Test Harness Architecture for R5 Audit Generation

To satisfy R5 and produce the comprehensive live markdown audit report, the following test runner architecture is recommended:

```
services/backend/smart-health-platform/backend/tests/
├── run_comprehensive_e2e_audit.ts  <-- Unified Master Audit Runner
└── (outputs) audit_report.md       <-- Generated Comprehensive Markdown Report
```

### Proposed Structure of `run_comprehensive_e2e_audit.ts`:
1. **Database Query Counter Middleware / Wrapper**:
   - Wrap `pool.query` to increment counters by query category (Facilities, Inventory, Alerts, Federation, Privacy Ledger).
2. **HTTP Telemetry Collector**:
   - Record exact HTTP response status, headers, and round-trip latency (ms) across all 4 ports (`:8000`, `:3000`, `:3001`, `:5173`).
3. **Multi-Section Verification Suite**:
   - **Section 1: 4-Port Service Health & CORS Telemetry**
   - **Section 2: Database Registry Audit (36 States/UTs, 179 PHCs, Drugs)**
   - **Section 3: AURA Point (PHC) Edge Testing (Sync Push, OCR, FEFO)**
   - **Section 4: AURA Vantage (Governance) 16-Route Diagnostic Probe**
   - **Section 5: AURA Sovereign (BRICS) Federated AI & Review Gate Audit**
     - 5-nation nodes check
     - Hash-chained round launch (`startFederatedRound`)
     - Model Review approval mutation (`approveAggregatedModel`)
     - Differential privacy monotonic bounds enforcement ($\epsilon \le 5.0$)
4. **Markdown Report Generator**:
   - Compiles all telemetry into a structured Markdown document with pass/fail tables, execution timestamps, exact HTTP statuses, and DB query totals.

---

## Summary of Actionable Implementation Items

1. **AURA Sovereign UI Fixes (`apps/brics-portal`)**:
   - **RoundReviewPage.tsx**: Update line 206 / action deck condition so that candidates in `'started'`, `'training'`, or `'awaiting_review'` display active `"Authorize & Publish"` and `"Reject & Quarantine"` buttons.
   - **Privacy Limit Normalization**: In `graphqlServer.ts` (line 1172), `PrivacyPage.tsx` (lines 64, 255, 280), `use-member-privacy-budget.ts` (line 36), and `PrivacyBudgetGauge.tsx` (line 17), replace all references to `10.0` with `5.0`.
2. **E2E Test Runner Implementation (`services/backend/.../tests/`)**:
   - Create `run_comprehensive_e2e_audit.ts` to execute R1–R5 end-to-end and output `audit_report.md`.
   - Add test cases covering `approveAggregatedModel`, `rejectAggregatedModel`, and $\epsilon > 5.0$ budget rejection.
