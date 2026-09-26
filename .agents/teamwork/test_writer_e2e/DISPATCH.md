# Task Assignment — Test Writer (Automated Cross-Portal Verification Suite)

## Identity
- Role: Automated Cross-Portal Verification Suite Developer
- TypeName: teamwork_preview_test_writer
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\test_writer_e2e

## Mandatory References
- ORIGINAL_REQUEST.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (MUST READ FIRST)
- PROJECT.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md
- TEST_INFRA.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\TEST_INFRA.md
- Explorer 3 Survey Report: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_3\survey_report.md
- Explorer 3 Handoff: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_3\handoff.md

## Exclusive Write Ownership
You EXCLUSIVELY own files in:
- `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts`
- `tests/**`
- `package.json` scripts in root and `services/backend/smart-health-platform/backend/package.json`

## Objective & Tasks
Develop the automated integration verification suite `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts` executing the complete operational cycle against live services on port 8000 (and ports 3000, 3001, 5173, 5000):

1. **Cycle Stages**:
   - **Stage 1 (Preflight Health Probes):** Verify HTTP 200 from `http://localhost:8000/health`, `http://localhost:8000/graphql`, `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`, and `http://localhost:5000/docs`.
   - **Stage 2 (PHC Portal Inventory & Bed Mutation):** Submit a real mutation via `POST http://localhost:8000/sync/push` simulating PHC entry (e.g. updating occupied beds or adjusting medicine inventory quantity).
   - **Stage 3 (Governance Multi-Tier GraphQL Assertion):** Query `http://localhost:8000/graphql` for `phcDetail`, `districtOverview`, `stateOverview`, and `nationalOverview`. Assert that the updated figures reflect accurately in the database aggregations at all three governance tiers.
   - **Stage 4 (Governance Decision Event):** Execute a governance event (e.g. approving a redistribution recommendation via `POST http://localhost:8000/api/v1/governance/redistribution/:id/decision` or starting a federated round via `mutation { startFederatedRound(...) }`).
   - **Stage 5 (BRICS Federated Intelligence Assertion):** Query `http://localhost:8000/graphql` for `federatedRounds`, `federatedNodes`, `privacyBudgetLedger`, and `supplyChainShipments`. Assert that the BRICS queries return the updated federated intelligence and shipment ledger entries.
   - **Stage 6 (Reconciliation & Cleanup):** Revert test records or mark them processed, verifying database integrity.
2. **Pass/Fail Semantics**:
   - Log each verification step with explicit `[PASS]` / `[FAIL]` status and timestamps.
   - Exit with code `0` on 100% complete success. Exit with non-zero code on any assertion failure.
3. **Package Script Wiring**:
   - Add `"test:integration": "ts-node tests/verify_cross_portal_integration.ts"` to `services/backend/smart-health-platform/backend/package.json`.
   - Add `"verify": "npm --prefix services/backend/smart-health-platform/backend run test:integration"` to root `package.json`.
4. **Execution & Documentation**:
   - Execute the verification suite and verify its execution.
   - Author `TEST_READY.md` at project root `C:\Users\anshv\OneDrive\Desktop\Smart_governance\TEST_READY.md`.
   - Write handoff.md documenting the verification results.

## 2026-09-26T13:52:49Z
Received dispatch prompt to build, run and document the cross-portal integration verification suite.

