# Handoff Report — Explorer 3 (BRICS Portal & E2E Testing)

**Author:** Explorer 3 (`explorer_r3_brics_tests_3`)  
**Parent Agent:** `orchestrator_3` (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)  
**Type:** Hard Handoff (Investigation Complete)  
**Date:** 2026-09-26  

---

## 1. Observation

1. **AURA Sovereign Live GraphQL Client & Zero-Mock Architecture**:
   - `apps/brics-portal/src/graphql/client.ts` lines 10-38 connects `ApolloClient` directly to `http://localhost:8000/graphql` via `HttpLink` without any `SchemaLink` or local fallback schemas.
   - `apps/brics-portal/src/components/providers/ApolloWrapper.tsx` line 11 wraps the application with this live client. `mock-data.ts` and `resolvers.ts` are unused remnants.

2. **Sovereign Enclave Telemetry Roster**:
   - `apps/brics-portal/src/store/auth-store.ts` lines 13-97 and `apps/brics-portal/src/components/common/CountryNodeCard.tsx` lines 20-33 define the 5 member sovereign nations:
     - 🇮🇳 India (Varanasi Enclave `IN-01`, ICMR/MoHFW, Sumaiya Khan)
     - 🇧🇷 Brazil (São Paulo Enclave `BR-01`, Fiocruz/SUS, Dr. Carlos Silva)
     - 🇷🇺 Russia (Moscow Enclave `RU-01`, Rospotrebnadzor, Dr. Elena Rostova)
     - 🇨🇳 China (Shanghai Enclave `CN-01`, CCDC, Prof. Wei Zhang)
     - 🇿🇦 South Africa (Cape Town Enclave `ZA-01`, NICD, Thabo Mthembu)
   - Telemetry queries `GET_FEDERATED_NODES` (`apps/brics-portal/src/graphql/operations.ts` lines 10-25) and mutation `TOGGLE_COUNTRY_PARTICIPATION` (lines 179-187) are backed by `graphqlServer.ts` lines 1020-1053 and lines 1367-1383.

3. **5-Country Federated Training Simulation Engine**:
   - `apps/brics-portal/src/components/rounds/StartRoundModal.tsx` lines 69-121 implements the 4-stage interactive simulation pipeline:
     - Stage 1: Architecture dispatch to all 5 enclaves
     - Stage 2: PyTorch gradient training with dynamic per-enclave progress bars
     - Stage 3: Differential privacy noise addition ($\sigma = 1.12$) & Central FedAvg
     - Stage 4: Checkpoint created with $+36.8\%$ accuracy gain, rendering an animated CTA to navigate directly to `/review`.
   - `services/backend/smart-health-platform/backend/src/modules/federation/federationService.ts` lines 158-215 executes `startFederatedRound()` with deterministic SHA-256 hash chaining `computeRoundHash(prevHash, roundNumber, modelId, startedAt)` and inserts into `federation_rounds`.

4. **Human-in-the-Loop Model Review Gate (`/review`)**:
   - `apps/brics-portal/src/pages/RoundReviewPage.tsx` lines 288-450:
     - Compares candidate model against active model on MAE ($0.124$ vs $0.158$), RMSE ($0.189$ vs $0.231$), and forecast horizon ($12$ vs $8$ weeks).
     - Checks sovereign quorum ($\ge 4/5$ nations submitted).
     - Displays `PrivacyBudgetGauge` and expands `PrivacyTechnicalDetails` audit table.
     - Provides `"Authorize & Publish Global Model"` (`approveAggregatedModel`) and `"Reject & Quarantine Round"` (`rejectAggregatedModel`) actions.
   - **Observed Bug/Gap**: Line 206 states `const isAwaitingReview = candidateRound.status === 'awaiting_review';`. When a round is started via `StartRoundModal.tsx`, its status in PostgreSQL is `'training'` / `'started'`. Line 428 only renders the action buttons if `isAwaitingReview` is true. Thus, newly launched rounds display a static text badge rather than the approval/rejection action buttons.

5. **Differential Privacy Ledger & Regulatory Bound Enforcement ($\epsilon \le 5.0$)**:
   - `seedRealisticPrivacyLedger.ts` lines 21-55 seeds 20 rounds of monotonic cumulative $\epsilon$ with `budgetLimit = 5.0`.
   - `PrivacyBudgetChart.tsx` lines 186-203 renders the hard ceiling at `y = 5.0` with label `"SOVEREIGN HARD CEILING (ε ≤ 5.0)"`.
   - `FederationService.ts` line 176 enforces `currentMax + targetEpsilon <= 5.0`, throwing HTTP 422 `BUDGET_EXCEEDED` on breach.
   - **Observed Inconsistency**: In `graphqlServer.ts` line 1172, `PrivacyPage.tsx` lines 64, 255, 280, `use-member-privacy-budget.ts` line 36, and `FederationService.ts` line 275, fallback default limits and text cite `10.0` instead of `5.0`.

6. **E2E Testing & Audit Readiness**:
   - `services/backend/smart-health-platform/backend/tests/` contains 17 test files.
   - `verify_cross_portal_integration.ts` has 8 stages verifying backend health, sync push, governance GraphQL, redistribution decision, BRICS queries, teardown, and Gemini AI.
   - **Gaps**:
     - No test executes `approveAggregatedModel` or `rejectAggregatedModel`.
     - No test verifies $\epsilon > 5.0$ rejection.
     - No test scans all 16 governance routes on `:3000`.
     - No test verifies transparent 3-key Gemini API rotation under 429 quota failure.
     - Existing tests print to stdout with ANSI codes, but none generate the comprehensive markdown audit report with exact HTTP statuses, DB query counts, and component test logs mandated in requirement R5.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1)**: The BRICS portal communicates via Apollo Client directly with the Express/GraphQL backend on `:8000/graphql`, ensuring all rendered data originates from PostgreSQL.
2. **Premise 2 (Observation 2 & 3)**: Sovereign enclave telemetry and 5-country federated training simulation are fully implemented in `NodesPage.tsx`, `CountryNodeCard.tsx`, `StartRoundModal.tsx`, and `FederationService.ts`. Launching a training round creates a real DB record in `federation_rounds` with SHA-256 hash chaining.
3. **Premise 3 (Observation 4)**: The Model Review Gate in `RoundReviewPage.tsx` verifies accuracy gains, quorum, and privacy bounds, but the action buttons require `candidateRound.status === 'awaiting_review'`. Because `startFederatedRound` enters the DB with status `'training'`, the review page remains in a non-actionable state unless `'training'`/`'started'` are included in the actionable statuses or the simulation transitions status to `'awaiting_review'`.
4. **Premise 4 (Observation 5)**: Requirement R4 mandates $\epsilon \le 5.0$ enforcement and ledger display. While `FederationService.startFederatedRound` and `PrivacyBudgetChart` enforce $5.0$, `graphqlServer.ts` and `PrivacyPage.tsx` contain fallbacks and copy referencing $10.0$. Reconciling these ensures consistency.
5. **Premise 5 (Observation 6)**: While extensive unit and integration tests exist in `tests/`, none of the current scripts generate the markdown audit report required by R5 with exact HTTP status codes and database query counts. Creating a master runner (`run_comprehensive_e2e_audit.ts`) will bridge this gap.

---

## 3. Caveats

1. Direct terminal commands (`run_command`) timed out on user permission prompts. All investigations were conducted using direct filesystem inspection (`view_file`, `find_by_name`, `grep_search`).
2. Live running browser DOM inspection was not performed directly via browser automation tools; analysis is based on static component source code and interface contract definitions.
3. No code modifications were made to the codebase in accordance with the read-only Explorer role.

---

## 4. Conclusion

AURA Sovereign (`apps/brics-portal` :3001) has a mature, live-wired architecture with complete sovereign telemetry across 5 BRICS nations, an interactive 4-stage simulation engine, a comprehensive human-in-the-loop review gate, and differential privacy charts.

To achieve 100% audit readiness and satisfy requirements R1–R5:
1. **Model Review Action Gate**: Allow rounds with status `'started'`, `'training'`, or `'awaiting_review'` to activate the approval/rejection action deck in `RoundReviewPage.tsx`.
2. **Differential Privacy Bound Normalization**: Standardize all fallback `budgetLimit` variables and informational text from `10.0` to `5.0` across `graphqlServer.ts`, `PrivacyPage.tsx`, and `use-member-privacy-budget.ts`.
3. **Master E2E Audit Script**: Implement `run_comprehensive_e2e_audit.ts` in `services/backend/smart-health-platform/backend/tests/` to orchestrate 4-port health checks, multi-tier data propagation, BRICS review actions, and emit a formatted `audit_report.md` capturing HTTP statuses, DB query counts, and component test logs.

---

## 5. Verification Method

To independently verify all findings in this report:

1. **Verify Live Client Wiring**:
   - Inspect `apps/brics-portal/src/graphql/client.ts` line 10 to confirm `BACKEND_URL` points to `http://localhost:8000/graphql`.
2. **Verify Review Gate Action Condition**:
   - Inspect `apps/brics-portal/src/pages/RoundReviewPage.tsx` lines 206 and 428: confirm `isAwaitingReview = candidateRound.status === 'awaiting_review'`.
3. **Verify Privacy Budget Ceiling Discrepancies**:
   - Inspect `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts` line 1172: confirm `COALESCE(budget_limit, 10.0)::float AS "budgetLimit"`.
   - Inspect `apps/brics-portal/src/pages/PrivacyPage.tsx` line 64: confirm `entries[0]?.budgetLimit ?? 10.0`.
   - Inspect `apps/brics-portal/src/components/privacy/PrivacyBudgetChart.tsx` line 202: confirm `SOVEREIGN HARD CEILING (ε ≤ 5.0)`.
4. **Verify Existing E2E Integration Suite**:
   - Inspect `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts` lines 130-900 to verify 8-stage operational assertions.
   - Run `npx ts-node tests/verify_cross_portal_integration.ts` from `services/backend/smart-health-platform/backend` when the backend is active.
