# Dispatch Instructions for Worker 3 (Master E2E Live Verification Suite & Markdown Audit Generator)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_audit_3`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & File Ownership
You exclusively own and may edit:
- `services/backend/smart-health-platform/backend/tests/run_comprehensive_e2e_audit.ts`
- Any helper test files in `services/backend/smart-health-platform/backend/tests/`
- Output report: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\AUDIT_REPORT.md`

## Mandatory Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks
1. Implement `services/backend/smart-health-platform/backend/tests/run_comprehensive_e2e_audit.ts` covering:
   - **Stage 1 (Service Health & Port Liveness)**:
     - Verify ports 8000, 5432, 5173, 3000, 3001 are responding.
     - Verify `/health`, `/graphql`, `/api/v1/facilities`, `/api/v1/inventory`, `/api/v1/inventory/facilities`, `/api/v1/inventory/medicines`, `/api/v1/ocr/status`, `/api/v1/events/stream`, `/governance/kpi/stream`.
   - **Stage 2 (R1: PostgreSQL 179 PHCs & 36 States/UTs)**:
     - Verify database query counts and records: 36 states/UTs, 91 districts, 179 PHCs via `/api/v1/jurisdiction/hierarchy` and `/api/v1/phc/facilities`.
     - Verify facility inventories, FEFO batches, audit log hash chain (`/api/v1/audit/verify`).
   - **Stage 3 (R2: AURA Point PHC Workbench)**:
     - Test staff auth (`POST /api/v1/phc/auth/verify`).
     - Test Dexie offline mutation push (`POST /sync/push`) with `inventory_batches`, `alerts`, `patient_footfall`, and pull delta (`GET /sync/pull`).
     - Test FEFO batch dispensing (`POST /api/v1/phc/:phcId/billing/checkout`) verifying earliest expiry batch depletion.
     - Test emergency incident reporting (`alert_report` mutation) and alert creation in PostgreSQL.
   - **Stage 4 (R2: Gemini OCR 3-Key Pool & 429 Rotation)**:
     - Test OCR endpoint `POST /api/v1/ocr/extract-prescription` and `POST /api/v1/ai/vision/extract-prescription`.
     - Test 3-key pool rotation and multi-key discovery.
     - Test simulated 429 failover to verify transparent multi-key rotation.
   - **Stage 5 (R3: AURA Vantage 16 Governance Modules & Diagnostics)**:
     - Probing all 16 governance routes on port 3000 (`/governance`, `/gis`, `/medicine`, `/resources`, `/workforce`, `/patients`, `/forecasts`, `/early-warnings`, `/analytics`, `/redistribution`, `/supply-chain`, `/emergency`, `/simulator`, `/copilot`, `/audit`, `/admin`, `/manage-jurisdiction`).
     - Verify GIS hierarchy and PHC pin density.
     - Verify redistribution engine decision flow (`POST /api/v1/governance/redistribution/:id/decision`).
     - Verify real-time SSE stream connectivity.
   - **Stage 6 (R4: AURA Sovereign BRICS Federated Grid)**:
     - Query 5 sovereign enclave nodes (IN, BR, RU, CN, ZA) via GraphQL `federatedNodes`.
     - Start a federated training simulation round via `startFederatedRound` mutation.
     - Test human-in-the-loop candidate model review gate via `approveAggregatedModel` mutation.
     - Test differential privacy bounds: assert all ledger entries have ε ≤ 5.0, and assert that starting a round with ε > 5.0 is rejected with HTTP 422 `BUDGET_EXCEEDED`.
   - **Stage 7 (R5: Markdown Audit Report Generation)**:
     - Collect exact HTTP statuses, latency, DB query counts, and component test logs.
     - Write formatted markdown audit report to:
       `c:\Users\anshv\OneDrive\Desktop\Smart_governance\AUDIT_REPORT.md`
2. Run `npx ts-node tests/run_comprehensive_e2e_audit.ts` from `services/backend/smart-health-platform/backend`.
3. Verify that all tests pass (100%) and that `AUDIT_REPORT.md` is populated.
4. Sync updated files to runtime mirror `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`.
5. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_audit_3\handoff.md` and notify parent via `send_message`.

## 2026-09-26T19:03:19Z
You are Worker 3 (Master E2E Live Verification Suite & Markdown Audit Generator).
Tasks:
1. Implement `services/backend/smart-health-platform/backend/tests/run_comprehensive_e2e_audit.ts` to perform end-to-end live testing across R1, R2, R3, R4, and R5:
   - Stage 1: Port Liveness (8000, 5432, 5173, 3000, 3001) and API route health.
   - Stage 2 (R1): PostgreSQL live verification (36 states/UTs, 91 districts, 179 PHCs, drug inventories, FEFO batches, audit log hash chain).
   - Stage 3 (R2): AURA Point PHC Workbench (staff auth, Dexie mutation sync push/pull, FEFO checkout, incident alert reporting).
   - Stage 4 (R2): Gemini OCR 3-key pool rotation and simulated 429 transparent rotation test.
   - Stage 5 (R3): AURA Vantage Governance Command (HTTP probe of all 16 governance routes on :3000, GIS hierarchy, redistribution approval decision, SSE streams).
   - Stage 6 (R4): AURA Sovereign BRICS (5 sovereign enclaves IN, BR, RU, CN, ZA, federated training round start, human-in-the-loop candidate model review approval mutation, differential privacy budget ledger check ε ≤ 5.0, and ε > 5.0 budget breach rejection check with 422).
   - Stage 7 (R5): Markdown Audit Report Generator: outputs exact HTTP status codes, DB query counts, response times, and component test logs to `c:\Users\anshv\OneDrive\Desktop\Smart_governance\AUDIT_REPORT.md`.
2. Run the test script with `npx ts-node tests/run_comprehensive_e2e_audit.ts` from `services/backend/smart-health-platform/backend`.
3. Verify all tests pass (100%) and that `AUDIT_REPORT.md` is populated.
4. Sync updated files to runtime mirror `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`.
5. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_audit_3\handoff.md` and message parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b).
