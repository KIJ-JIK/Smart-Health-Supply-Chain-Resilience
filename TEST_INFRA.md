# E2E Test Infra: Smart Health Supply Chain Resilience

## Test Philosophy
- Opaque-box, requirement-driven cross-portal integration verification derived from `ORIGINAL_REQUEST.md`.
- Verifies real database transactions across all three operational tiers without mocks.
- Systematic 4-tier methodology:
  - **Tier 1 (Feature Coverage):** Direct verification of individual portal endpoints, mutations, and queries in isolation.
  - **Tier 2 (Boundary & Corner Cases):** Verification under boundary values (zero stock, negative occupancy rejection, high latency, max capacity, non-existent entity lookups).
  - **Tier 3 (Cross-Feature Combinations):** Multi-tier interactions (PHC stock drop triggering Governance low-stock alert; Governance redistribution creating BRICS supply chain tracking).
  - **Tier 4 (Real-World Application Scenarios):** Full operational lifecycle (PHC patient surge -> inventory depletion -> Governance emergency redistribution approval -> BRICS federated model re-training round -> validation of all tiers).

## Feature Inventory & Test Mapping
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Live PHC Sync (Push/Pull) | R1, R2 | 5 | 5 | ✓ |
| 2 | Live Governance Overviews (National/State/District) | R1, R2 | 5 | 5 | ✓ |
| 3 | Live Governance Redistribution Actions | R2 | 5 | 5 | ✓ |
| 4 | Live BRICS Federated Queries & Ledger | R1, R2 | 5 | 5 | ✓ |
| 5 | Cross-Portal Multi-Tier Propagation | R2, R3 | 5 | 5 | ✓ |
| 6 | Dual-Path Sync & Healthchecks | R4 | 5 | 5 | ✓ |

## Test Architecture
- **Runner Script:** `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts`
- **Invocation:**
  - `npm --prefix services/backend/smart-health-platform/backend run test:integration`
  - `npm run verify` from monorepo root
- **Exit Semantics:** Logs each step with explicit pass/fail checks; exits with `0` on full success and non-zero on any failure.
- **Payloads & Assertions:**
  - Real HTTP POST to `/sync/push` on port 8000 with genuine mutation UUIDs.
  - Real GraphQL queries over HTTP to `http://localhost:8000/graphql` asserting expected values in PostgreSQL `smarthealth`.
  - Real REST calls to `/api/v1/governance/redistribution/:id/decision`.
  - Real GraphQL mutations starting federated rounds.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| S1 | PHC Emergency Epidemic Spike & Resource Depletion | PHC stock deduction, bed occupancy increase, Governance state/district alert generation | High |
| S2 | Governance Inter-District Supply Redistribution | Governance recommendation approval, shipment dispatch event, supply chain tracking | High |
| S3 | Cross-Border Federated Learning Round Trigger | Governance national threshold trigger, BRICS federated round launch, privacy budget decrement | High |
| S4 | Full Multi-Tier End-to-End Operational Lifecycle | PHC mutation -> Governance overview reflection -> Redistribution approval -> BRICS ledger update | High |

## Coverage Thresholds
- Tier 1: ≥ 5 test checks per core feature
- Tier 2: Boundary value validations (invalid UUIDs, extreme quantities, zero counts)
- Tier 3: Pairwise cross-tier interaction validations
- Tier 4: Complete end-to-end multi-tier lifecycle scenario
