# Execution Plan — orchestrator_3

## Objective
Comprehensive live end-to-end testing, verification, debugging, and auto-fixing across all three portals (AURA Vantage :3000, AURA Point :5173, AURA Sovereign :3001) and PostgreSQL backend (:8000), fulfilling requirements R1 through R5.

## Phase 1: Exploration & Live State Survey
- **Explorer 1 (Backend & Persistence - R1):**
  - Verify PostgreSQL connection and data integrity (179 PHCs across 36 Indian states/UTs, facility drug inventories, transaction logs).
  - Verify real-time SSE event streaming (`/api/v1/events/stream`) and GraphQL queries/mutations.
  - Identify any disconnected hooks, mock fallbacks, or broken endpoints in backend services.
- **Explorer 2 (AURA Point & AURA Vantage - R2 & R3):**
  - AURA Point (:5173): Staff auth, prescription camera OCR with 3-key Google Gemini API pool, Dexie.js offline queueing, FEFO batch dispensing, incident reporting, multi-key rotation error handling.
  - AURA Vantage (:3000): 16 governance modules, GIS Map layers, crisis simulation parameters, AI stockout redistribution engine, SSE alert stream, jurisdiction management, UI clipping/route latency.
- **Explorer 3 (AURA Sovereign & Test Automation - R4 & R5):**
  - AURA Sovereign (:3001): Sovereign enclave telemetry (India, Brazil, Russia, China, South Africa), 5-country federated training simulation engine, human-in-the-loop candidate model review gate (`/review`), differential privacy monotonic ledger bounds (ε ≤ 5.0).
  - Test suites & audit readiness: Inspect existing test scripts (`verify_cross_portal_integration.ts`, unit tests, e2e tests), identify needed fixes, missing coverage, and audit telemetry collection.

## Phase 2: Implementation & Auto-Fixes (Workers)
- Worker 1: Backend & Multi-Key OCR Pool & API fixes (address R1, Gemini 3-key rotation pool in backend/OCR routes, event streaming, GraphQL schema harmonization).
- Worker 2: AURA Point & AURA Vantage UI/route fixes (Dexie.js offline sync, FEFO dispensing, 16 governance modules, GIS map layers, visual clipping & route latency fixes).
- Worker 3: AURA Sovereign BRICS & E2E Test Suite / Audit telemetry runner (5-country federated training, `/review` gate, DP ledger ε ≤ 5.0, full end-to-end multi-tier test runner).

## Phase 3: Adversarial Review & Verification
- Reviewers evaluate code modifications, route integrity, and test coverage.
- Challengers empirically stress-test multi-key rotation under rate limits, offline Dexie sync under network cutoff, DP bounds, and cross-portal propagation.

## Phase 4: Forensic Integrity Audit Gate
- Forensic Auditor verifies genuine implementation without fake/hardcoded mocks or bypasses.

## Phase 5: Synthesis, Markdown Audit Report & Final Completion Report
- Compile comprehensive markdown audit report with exact HTTP statuses, DB query counts, telemetry logs.
- Deliver completion report to parent agent via `send_message`.
