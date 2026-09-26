# Dispatch Instructions for Explorer 2 (PHC & Governance Portals)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & Instructions
1. Read the user's original request:
   `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically the latest section dated 2026-09-26T18:24:09Z).
2. Read `c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md`.
3. Investigate AURA Point (`apps/phc-portal` on :5173):
   - Staff authentication flow and API integration.
   - Prescription camera OCR extraction: components, camera/file upload, API integration with the 3-key Google Gemini API pool.
   - Dexie.js offline mutation queueing: local database tables, offline queue, sync push/pull triggers.
   - FEFO (First-Expired, First-Out) batch dispensing logic and UI.
   - Emergency incident reporting workflow and backend event trigger.
   - OCR multi-key rotation transparent error handling in the UI (handling rate limits gracefully).
4. Investigate AURA Vantage (`apps/governance-portal` on :3000):
   - 16 governance modules (verify route paths, App Router pages, components, data hooks).
   - GIS Map layers: State boundaries, PHC pin density across all 36 Indian states/UTs, map rendering.
   - Crisis simulation parameters & AI stockout redistribution engine.
   - Real-time alert SSE stream connectivity.
   - Jurisdiction management (national, state, district drill-downs).
   - Check for UI visual clipping, route latency, or broken API hooks.
5. Document all findings in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2\findings.md`.
6. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2\handoff.md` and notify parent via `send_message`.

## 2026-09-26T18:26:27Z
You are Explorer 2 (PHC & Governance Portals).
Your working directory is: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2
Read your instructions in: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2\DISPATCH.md
Read the user's original request in: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (latest request 2026-09-26T18:24:09Z).
Read c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md.

Task:
1. Investigate AURA Point (:5173):
   - Staff authentication flow.
   - Prescription camera OCR extraction with 3-key Google Gemini API pool and camera/file upload.
   - Dexie.js offline mutation queueing (push/pull sync, offline storage).
   - FEFO batch dispensing logic and UI.
   - Emergency incident reporting workflow and event dispatch.
   - Transparent OCR multi-key rotation error handling on the client.
2. Investigate AURA Vantage (:3000):
   - Verify all 16 governance modules (routes, App Router pages, components, data hooks).
   - GIS Map layers: State boundaries, PHC pin density across 36 Indian states/UTs.
   - Crisis simulation parameters & AI stockout redistribution engine.
   - Real-time alert SSE stream integration.
   - Jurisdiction management.
   - Check for UI visual clipping, route latency, or broken API hooks.
3. Write your detailed report to: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2\findings.md
4. Write your handoff report to: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_frontend_2\handoff.md
5. Send a completion message to your parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b) with send_message.
