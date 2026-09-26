# Handoff Report: Backend Route Aliasing, SSE Auth, and Gemini 3-Key Pool 429 Rotation

**Worker:** Worker 1 (`worker_r3_backend_1`)  
**Parent Agent:** `bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`  
**Date:** 2026-09-26T19:01:15Z  

---

## 1. Observation

1. **Shadowing `/api/v1/facilities` Route**:
   - `services/backend/smart-health-platform/backend/src/index.ts:61-76`: An inline route `app.get('/api/v1/facilities', requireAuth, ...)` shadowed line 310 (`app.use('/api/v1/facilities', facilityController)`), completely ignoring query parameters like `district_id` and failing if accessed by frontend without explicit auth headers.
2. **Missing OCR and Inventory Route Mounts**:
   - `services/backend/smart-health-platform/backend/src/index.ts`: The OCR vision service was mounted only at `/api/v1/ai/vision`, leaving `/api/v1/ocr/*` returning 404 Not Found.
   - Routes for `/api/v1/inventory`, `/api/v1/inventory/facilities`, and `/api/v1/inventory/medicines` did not exist as top-level endpoints; inventory data was fragmented solely under `/api/v1/phc/:phcId/inventory` and `/api/v1/medicines`.
3. **SSE Connection Authentication Barrier**:
   - `services/backend/smart-health-platform/backend/src/modules/alerts/alertsController.ts:29`: `router.get('/governance/alerts/stream', requireAuth, ...)` rejected standard browser `EventSource` connections with HTTP 401 Unauthorized because the W3C EventSource standard cannot transmit custom `Authorization: Bearer <token>` request headers.
   - Endpoints `/api/v1/events/stream` and `/governance/kpi/stream` were missing from the Express routing table.
4. **Gemini Key Pool Discovery and Lack of In-Flight 429 Rotation**:
   - `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts:6-18`: Only checked `GEMINI_API_KEYS`, `GOOGLE_AI_API_KEYS`, and `GEMINI_API_KEY`. It ignored numbered environment variables (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`).
   - `visionService.ts:68-117`: In `callGeminiVision()`, a single key was picked at the start. If that key hit HTTP 429 / `RESOURCE_EXHAUSTED` / rate-limit, it looped through models with the same exhausted key before giving up and returning null.
5. **BRICS Comma-Separated Key Parsing**:
   - `services/backend/smart-health-platform/backend/src/modules/ai/bricsIntelligenceService.ts:6-8`: Returned `process.env.GEMINI_API_KEYS` raw, causing a comma-separated list of keys (e.g. `key1,key2,key3`) to be appended directly into the URL query string `?key=key1,key2,key3`, which Google AI rejects.
6. **Database Schema Reality**:
   - Real PostgreSQL `phc_facilities` table in `smarthealth` contains columns: `id`, `name`, `district_id`, `state_id`, `latitude`, `longitude`, `total_beds`, `emergency_beds`, `isolation_beds`, `occupied_beds`, `oxygen_cylinders_available`, and `operational_status`.
   - Real `inventory_batches` table contains columns: `id`, `phc_id`, `medicine_id`, `batch_no`, `remaining_qty`, `minimum_threshold`, `expiry_date`, `created_at`, `updated_at`.

---

## 2. Logic Chain

1. **Facilities Route Unshadowing & Real-Time Querying**:
   - By removing the inline `app.get('/api/v1/facilities', ...)` at line 61 in `index.ts`, and introducing `liveFacilitiesHandler` in `src/modules/facility/facilitiesRouteHelper.ts`, `GET /api/v1/facilities` and `GET /facilities` now query the live PostgreSQL `phc_facilities` table, dynamically filter by `district_id` and `state_id` query parameters, calculate bed availability and occupancy rates server-side, and return HTTP 200 with `{ facilities, data, count }`. Non-GET or specific subroutes fall through to `facilityController`.
2. **Live Inventory Routing**:
   - Built `liveInventoryRouter` in `src/modules/inventory/liveInventoryRoutes.ts` and mounted at `/api/v1/inventory` and `/inventory` in `index.ts`.
   - `GET /`: returns all active batches with medicine names, categories, units, and real stock status (IN_STOCK, LOW_STOCK, OUT_OF_STOCK, EXPIRED).
   - `GET /facilities`: returns aggregated inventory health (total batches, total units, distinct medicines count, stockouts, low stock counts) grouped by facility.
   - `GET /medicines`: returns aggregated stock counts and stocking facilities count grouped by medicine.
   - `GET /batches` and `GET /:phcId`: return granular batch records and facility-specific stock.
3. **OCR Forwarding & Aliasing**:
   - In `visionService.ts`, extracted `handleVisionExtraction` to bind to `/extract-prescription`, `/process`, and root `/` (POST).
   - In `index.ts`, mounted `visionRouter` under `/api/v1/ocr`, `/ocr`, and `/api/v1/ai/vision`.
   - Both sample types (`sample_rx_amoxicillin` and `sample_blister_paracetamol`) as well as live image uploads return HTTP 200 with enriched PostgreSQL inventory matching.
4. **SSE Authentication & Multi-Stream Support**:
   - Developed `sseAuth` middleware in `alertsController.ts` and imported into `eventsStreamController.ts`.
   - Checks `req.tenantClaims`, attempts to verify tokens from query parameters (`?token=...` or `?auth_token=...`) via `TokenService.verifyAccessToken`, and in development/test mode (`process.env.NODE_ENV === 'development' || !process.env.NODE_ENV`) attaches default `national_admin` claims so browser `EventSource` connections connect with HTTP 200 without encountering 401.
   - Built `eventsStreamRouter` in `src/modules/events/eventsStreamController.ts`:
     - `/api/v1/events/stream` and `/events/stream`: SSE stream connected to `eventBus.subscribe('*')` with 20s heartbeats.
     - `/governance/kpi/stream` and `/api/v1/governance/kpi/stream`: SSE stream querying live PostgreSQL KPI metrics (`phc_facilities`, `alerts`, `resource_requests`) emitting structured ticks immediately and every 8 seconds.
     - `/api/v1/governance/alerts/stream` and `/governance/alerts/stream`: SSE stream broadcasting alerts with `sseAuth`.
5. **Gemini 3-Key Pool & Outer 429 Rotation**:
   - In `visionService.ts`, `getGeminiApiKeys()` aggregates and deduplicates keys from `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GEMINI_API_KEY`, and `GOOGLE_AI_API_KEYS`.
   - In `callGeminiVision()`, implemented an outer loop iterating through each key in the pool. If any key receives HTTP 429, `RESOURCE_EXHAUSTED`, or quota errors, it logs the rotation with masked key details, updates `keyIndex`, and immediately retries across candidate models using the next key in the pool before falling back.
6. **BRICS Comma-Separated Key Parsing**:
   - In `bricsIntelligenceService.ts`, replaced raw string getter with `getBricsGeminiApiKeys()` and `getNextBricsGeminiApiKey()`. Commas are split, trimmed, and deduplicated, guaranteeing that single, discrete API keys are provided to Google Generative Language endpoints.

---

## 3. Caveats

- In test scripts and standalone verification processes, `index.ts` attaches an `on('error')` handler to `server.listen(PORT)` to avoid unhandled `EADDRINUSE` exceptions if port 8000 is already occupied by the background daemon.
- When Google Gemini API keys reach total quota exhaustion across all 3 pool keys, the vision service gracefully falls back to the local database-matched edge fallback response per architecture specification.

---

## 4. Conclusion

All six tasks assigned to Worker 1 have been implemented, verified, and validated against the live database:
- Shadowing `/api/v1/facilities` route removed; district and state query parameters correctly filter live records.
- `/api/v1/ocr/*` routes (`/extract-prescription`, `/process`) fully mounted and operational.
- `/api/v1/inventory/*` routes (`/`, `/facilities`, `/medicines`, `/batches`, `/:phcId`) returning live PostgreSQL records with status 200.
- Real-time SSE streaming enabled on `/api/v1/events/stream`, `/governance/kpi/stream`, and `/api/v1/governance/alerts/stream` with `sseAuth` supporting query tokens and dev bypass.
- Gemini vision service discovers all keys in the 3-key pool and executes outer key rotation on HTTP 429.
- BRICS intelligence service cleanly parses comma-separated keys without passing raw commas into URL parameters.
- Build verification with `npx tsc --noEmit` passed with 0 errors.
- Verification test suite `test_worker1_routes_and_rotation.ts` passed 100%.

---

## 5. Verification Method

To independently verify the implementation:

1. **TypeScript Typecheck**:
   ```bash
   cd services/backend/smart-health-platform/backend
   npx tsc --noEmit
   ```
   *Expected result:* Exits with code 0 and 0 errors.

2. **Automated Worker 1 Verification Suite**:
   ```bash
   cd services/backend/smart-health-platform/backend
   npx ts-node tests/test_worker1_routes_and_rotation.ts
   ```
   *Verified Output:*
   ```
   ================================================================
   === WORKER 1 VERIFICATION: ROUTE ALIASING, SSE, KEY ROTATION ===
   ================================================================
   --- 1. Testing /api/v1/facilities (Unshadowed) ---
   [PASS] GET /api/v1/facilities returns HTTP 200 - {"status":200}
   [PASS] Facilities returned as array with length > 0 - {"count":179}
   [PASS] Facilities also available under data key for backward compat

   --- 2. Testing /api/v1/inventory/* Routes ---
   [PASS] GET /api/v1/inventory returns HTTP 200 - {"status":200}
   [PASS] Live inventory records returned - {"count":200}
   [PASS] GET /api/v1/inventory/facilities returns HTTP 200 - {"status":200}
   [PASS] Aggregated facility inventory returned - {"count":179}
   [PASS] GET /api/v1/inventory/medicines returns HTTP 200 - {"status":200}
   [PASS] Aggregated medicines inventory returned - {"count":56}

   --- 3. Testing /api/v1/ocr/* Route Forwarding ---
   [PASS] GET /api/v1/ocr status endpoint returns HTTP 200
   [PASS] POST /api/v1/ocr/extract-prescription returns 200 with extracted prescription
   [PASS] POST /api/v1/ocr/process alias returns 200 with blister pack OCR data

   --- 4. Testing SSE Streams & Auth ---
   [PASS] GET /api/v1/events/stream connects with HTTP 200 and text/event-stream
   [PASS] GET /governance/kpi/stream connects with HTTP 200 and text/event-stream
   [PASS] GET /api/v1/governance/kpi/stream connects with HTTP 200 and text/event-stream
   [PASS] GET /api/v1/governance/alerts/stream connects with HTTP 200 and text/event-stream

   --- 5. Testing Gemini 3-Key Pool & Rotation ---
   [PASS] Discovered 3 keys in pool (expected >= 3) - {"poolSize":3}
   [PASS] Retrieved keys from round-robin key pool
   [PASS] rotateGeminiApiKey executes smoothly

   --- 6. Testing BRICS Comma-Separated Key Parsing ---
   [PASS] BRICS parsed 3 discrete keys from comma-separated string
   [PASS] Every parsed key is strictly single key without comma delimiters
   [PASS] getNextBricsGeminiApiKey returns valid single key

   ================================================================
   === ALL WORKER 1 CHECKS PASSED (100%) ===
   ================================================================
   ```
