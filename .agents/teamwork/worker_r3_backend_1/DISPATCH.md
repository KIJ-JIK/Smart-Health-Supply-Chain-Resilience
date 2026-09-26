# Dispatch Instructions for Worker 1 (Backend Route Aliasing, SSE Auth, and Gemini 3-Key Pool 429 Rotation)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_backend_1`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & File Ownership
You exclusively own and may edit:
- `services/backend/smart-health-platform/backend/src/index.ts`
- `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts`
- `services/backend/smart-health-platform/backend/src/modules/ai/bricsIntelligenceService.ts`
- `services/backend/smart-health-platform/backend/src/modules/alerts/alertsController.ts`
- Any new route helper file needed in `services/backend/smart-health-platform/backend/src/modules/`

## Mandatory Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks
1. Route Aliasing & Clean Mounts in `services/backend/smart-health-platform/backend/src/index.ts`:
   - Remove the shadowing `app.get('/api/v1/facilities', ...)` on line 61 so `facilityController` handles queries and district filtering.
   - Mount `/api/v1/ocr` route forwarding requests (such as `POST /api/v1/ocr/extract-prescription` and `POST /api/v1/ocr/process`) to the vision extraction service, or alias it to `visionService` router.
   - Mount `/api/v1/inventory` router / routes so that `/api/v1/inventory`, `/api/v1/inventory/facilities`, and `/api/v1/inventory/medicines` return live database records with status 200.
   - Mount `/api/v1/events/stream` and `/governance/kpi/stream` (and `/api/v1/governance/kpi/stream`) for real-time SSE streaming.
2. SSE Stream Authentication:
   - In `alertsController.ts` and `events/stream`, allow connections with `?token=...` query parameter or allow connection if in development mode so browser `EventSource` (which cannot send `Authorization` headers) connects with HTTP 200 without 401 Unauthorized.
3. Gemini OCR 3-Key Pool & 429 Rate-Limit Rotation:
   - In `visionService.ts`:
     - Support key discovery from: `GEMINI_API_KEYS` (comma-separated), `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, as well as `GEMINI_API_KEY`.
     - In `callGeminiVision`: implement an outer key retry loop. If an API key encounters HTTP 429 / RESOURCE_EXHAUSTED or quota exhaustion, immediately log the rotation and retry with the next available key in the pool across the candidate models before falling back.
   - In `bricsIntelligenceService.ts`: parse comma-delimited `GEMINI_API_KEYS` properly (take first or rotate) so it does not pass raw comma-separated keys into query parameters.
4. Build Verification:
   - Run `npx tsc --noEmit` or build command in `services/backend/smart-health-platform/backend` to verify 0 TypeScript compiler errors.
5. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_backend_1\handoff.md` with build verification results, and notify parent via `send_message`.

## 2026-09-26T18:43:15Z
Received dispatch from parent bd4c7b6b-1aab-437a-b230-ab00ebc0a88b:
Tasks:
1. Fix backend route aliasing & mounting in `services/backend/smart-health-platform/backend/src/index.ts`:
   - Remove shadowing `app.get('/api/v1/facilities', ...)` on line 61.
   - Mount `/api/v1/ocr/*` route forwarding to vision service.
   - Mount `/api/v1/inventory/*` routes returning live inventory data with 200 OK.
   - Mount `/api/v1/events/stream` and `/governance/kpi/stream` (and `/api/v1/governance/kpi/stream`) SSE stream endpoints.
2. In `alertsController.ts` and `events/stream`, allow connections with `?token=...` or bypass auth if in development mode so browser EventSource connects with HTTP 200 without 401.
3. In `visionService.ts`, support 3-key pool (`GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`) and implement outer key rotation loop on 429 / rate limit.
4. In `bricsIntelligenceService.ts`, properly parse comma-separated keys.
5. Compile and verify TypeScript with `npx tsc --noEmit`.
6. Write handoff report to `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_backend_1\handoff.md` and message parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b).
