# Dispatch Instructions for Explorer 1 (Backend & Persistence)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_backend_1`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & Instructions
1. Read the user's original request:
   `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically the latest section dated 2026-09-26T18:24:09Z).
2. Read `c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md`.
3. Investigate the live backend and persistence layer (`services/backend/smart-health-platform/backend`):
   - PostgreSQL `smarthealth` schema, tables, and seeds:
     - Check if 179 PHCs across 36 Indian states/UTs exist in DB or seeds.
     - Check facility drug inventories, transaction logs, and real-time event streaming.
     - Check if any mock fallbacks or disconnected hooks exist in backend routers or services.
   - Endpoint responsiveness and status:
     - `/api/v1/facilities`
     - `/api/v1/inventory/*`
     - `/api/v1/ocr/*` or `/api/v1/ai/vision/extract-prescription`
     - `/graphql`
     - `/health`
     - `/api/v1/events/stream`
   - Gemini API Key Pool:
     - Check how Gemini API keys are configured (environment variables, pool of 3 keys, e.g., GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 or GEMINI_API_KEYS).
     - Check multi-key rotation and error handling for quota/rate-limits (429/RESOURCE_EXHAUSTED).
4. Document all findings in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_backend_1\findings.md`.
5. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_r3_backend_1\handoff.md` and notify parent via `send_message`.

## 2026-09-26T18:34:42Z
**Context**: Surveying Backend & Persistence
**Content**: Checking on your progress. Note that `/api/v1/events/stream` is a continuous SSE stream and will not terminate HTTP requests automatically; please inspect code directly via view_file/grep_search or test non-streaming endpoints.
**Action**: Please proceed with verification and complete your findings.md and handoff.md reports.
