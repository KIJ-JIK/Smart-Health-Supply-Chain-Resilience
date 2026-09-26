## 2026-09-26T14:41:11Z

You are worker_verif_1, an implementation and verification worker.
Your working directory is: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_verif_1
Your parent is orchestrator_2 (88976d75-c093-45e4-96e2-bff6414f8774).
Project workspace root: C:\Users\anshv\OneDrive\Desktop\Smart_governance
Authoritative request: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CONTEXT & EXPLORER REPORTS:
Read the findings from:
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_verif_1\handoff.md (Service health & mock elimination)
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_verif_2\handoff.md (Google AI Vision, Multilateral Intelligence & 36-State GIS)
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_verif_3\handoff.md (Verification Suite & Dual-Path Sync)

TASKS TO COMPLETE:
1. Update Governance Portal Geography & GIS for all 36 States/UTs:
   - File: apps/governance-portal/src/lib/geography.ts
     Add the remaining 26 States/UTs (so all 28 States and 8 UTs are in STATES with canonical UUIDs and codes matching services/backend/smart-health-platform/database/seeds/all_india_36_states.sql).
   - File: apps/governance-portal/src/lib/gisData.ts
     Ensure JURISDICTION_EXTENTS has bounding extents for all states/UTs (or national coverage) and all state IDs are valid.
2. Augment Automated Verification Suite:
   - File: services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts
   - Update Stage 1.7 to assert stateCount >= 36.
   - In Stage 4, add execution of GraphQL mutation decideRedistribution (using transfer ID) in addition to the REST endpoint.
   - Add STAGE 7: Google AI Computer Vision Prescription & Packaging Scanner:
     * S7.1: POST /api/v1/ai/vision/extract-prescription with sampleType: 'sample_rx_amoxicillin' (asserts 200, detectedType 'prescription', medicines array >= 2, live PostgreSQL inventory matching with dbMatchedId / stockStatus).
     * S7.2: POST /api/v1/ai/vision/extract-prescription with sampleType: 'sample_blister_paracetamol' (asserts 200, detectedType 'medicine_packaging', brandName, batchNo).
   - Add STAGE 8: Google AI Multilateral Intelligence & All-India 36-State Registry:
     * S8.1: POST /api/v1/brics/ai-briefing with language: 'en' (asserts 200, threatLevel in LOW/ELEVATED/HIGH/CRITICAL, headline, regionalAlerts, federatedSurveillance).
     * S8.2: POST /api/v1/brics/ai-briefing with language: 'hi' (asserts 200, headline, language includes 'Hindi').
     * S8.3: Direct PostgreSQL query asserting stateCount >= 36 and checking presence of canonical UTs (Delhi, Ladakh, Lakshadweep).
   - Ensure the summary count and total checks reflect all stages (total ~30 checks), and the script exits with code 0 on complete pass.
3. Dual-Path Synchronization:
   - Create scripts/sync_to_runtime.bat that executes:
     robocopy "C:\Users\anshv\OneDrive\Desktop\Smart_governance" "C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience" /E /XD node_modules .git .next dist .agents .gemini /XF .env.local /R:1 /W:1 /NP /NFL /NDL
   - In root package.json, add "sync:runtime": "scripts\\sync_to_runtime.bat".
   - Execute the robocopy synchronization to ensure 100% synchronization to the runtime directory.
4. Execution & Verification:
   - Run the updated integration test suite: `npm --prefix services/backend/smart-health-platform/backend run test:integration` (or `npm run verify`).
   - Confirm all stages pass with exit code 0.
   - Document all command outputs, files modified, test logs, and synchronization results in your handoff report:
     C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_verif_1\handoff.md
   - Send completion message back to orchestrator_2.
