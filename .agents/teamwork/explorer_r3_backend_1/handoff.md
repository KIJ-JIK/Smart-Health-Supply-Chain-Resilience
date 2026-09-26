# Handoff Report: Explorer 1 (Backend & Persistence)

## 1. Observation

### Observation 1.1: Live Process and Port Health
Executing network connection check `Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 8000, 5432, 3000, 3001, 5173, 5000 }` yielded:
- Port 8000 (Central Backend Express/GraphQL): PID 31460, listening on `0.0.0.0`
- Port 5432 (PostgreSQL 16): PID 7884, listening on `127.0.0.1` and `::1`
- Port 5173 (AURA Point PHC Portal): PID 12596, listening
- Port 3000 (AURA Vantage Governance Portal): PID 30764, listening
- Port 3001 (AURA Sovereign BRICS Portal): PID 32548, listening
- Endpoint `http://localhost:8000/health` returned:
  `{"status":"ok","timestamp":"2026-09-26T18:31:48.631Z"}`

### Observation 1.2: 179 PHCs Across 36 Indian States and UTs in PostgreSQL
Executing HTTP request to `http://localhost:8000/api/v1/jurisdiction/hierarchy` returned:
```json
{
  "success": true,
  "data": {
    "counts": {
      "totalNations": 7,
      "totalStates": 36,
      "totalDistricts": 91,
      "totalPhcs": 179
    }
  }
}
```
All 28 States and 8 Union Territories are present in PostgreSQL table `states`:
`Andaman and Nicobar Islands`, `Andhra Pradesh`, `Arunachal Pradesh`, `Assam`, `Bihar`, `Chandigarh`, `Chhattisgarh`, `Dadra and Nagar Haveli and Daman and Diu`, `Delhi (NCT)`, `Goa`, `Gujarat`, `Haryana`, `Himachal Pradesh`, `Jammu and Kashmir`, `Jharkhand`, `Karnataka`, `Kerala`, `Ladakh`, `Lakshadweep`, `Madhya Pradesh`, `Maharashtra`, `Manipur`, `Meghalaya`, `Mizoram`, `Nagaland`, `Odisha`, `Puducherry`, `Punjab`, `Rajasthan`, `Sikkim`, `Tamil Nadu`, `Telangana`, `Tripura`, `Uttar Pradesh`, `Uttarakhand`, `West Bengal`.

Executing HTTP request to `http://localhost:8000/api/v1/phc/facilities` confirmed:
`{"count":179,"facilities":[{"id":"c402e65f-f7cf-421f-aeb5-7c7674faf7e2","name":"Port Blair Island Health Command",...}, ...]}`

### Observation 1.3: Facility Inventories, Billing Transactions, and Audit Logs
- In `services/backend/smart-health-platform/backend/src/modules/phc/phcPortalRoutes.ts:157`: `GET /api/v1/phc/:phcId/live-data` queries `phc_facilities`, `system_config`, `medicines`, `inventory_batches`, `patient_footfall`, `alerts`, `staff_registry`, `resource_requests`, `billing_transactions`, `stock_movements`, `equipment`, and `staff_attendance` directly from the PostgreSQL connection pool.
- In `services/backend/smart-health-platform/backend/src/modules/billing/billingController.ts:8`: `POST /api/v1/phc/:phcId/billing/checkout` enforces FEFO medicine dispensing with idempotency checks against `billing_transactions`.
- In `services/backend/smart-health-platform/backend/src/modules/audit/auditController.ts:51`: `GET /api/v1/audit/verify` verifies the SHA-256 hash chain of the `audit_log` table.

### Observation 1.4: Real-time Event Streaming Disconnects
- In `services/backend/smart-health-platform/backend/src/modules/alerts/alertsController.ts:29`:
  ```typescript
  router.get('/governance/alerts/stream', requireAuth, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    ...
  });
  ```
- Endpoint `/api/v1/events/stream` does NOT exist in the backend (returns 404).
- Endpoint `/governance/kpi/stream` (called in `apps/governance-portal/src/app/governance/page.tsx:85`) does NOT exist in the backend.
- `GET /api/v1/governance/alerts/stream` requires `requireAuth`. In `apps/governance-portal/src/hooks/useSseStream.ts:92`:
  `const es = new EventSource(url, { withCredentials: true });`
  Standard browser `EventSource` cannot send `Authorization: Bearer` headers, resulting in HTTP 401 Unauthorized errors on initial connection.

### Observation 1.5: Missing Endpoints & Route Shadowing
- In `services/backend/smart-health-platform/backend/src/index.ts:61`:
  `app.get('/api/v1/facilities', requireAuth, ...)` is registered before `app.use('/api/v1/facilities', facilityController)` (line 310), completely shadowing the controller's district filtering (`req.query.district_id`).
- There is NO `/api/v1/ocr/*` route mounted in `index.ts`. The OCR service is mounted exclusively at `POST /api/v1/ai/vision/extract-prescription` (`services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts:122`).
- There is NO root `/api/v1/inventory/*` wildcard route; inventory is split between `/api/v1/medicines` and `/api/v1/phc/:phcId/inventory`.

### Observation 1.6: Gemini Vision API Key Pool & Rate-Limit Flaws
- In `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts:8`:
  ```typescript
  function getGeminiApiKeys(): string[] {
    const keysStr = process.env.GEMINI_API_KEYS || process.env.GOOGLE_AI_API_KEYS || process.env.GEMINI_API_KEY || '';
    return keysStr.split(',').map((k) => k.trim()).filter(Boolean);
  }
  ```
  It does not check numbered keys `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`.
- In `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts:64-117`:
  ```typescript
  async function callGeminiVision(imageBase64, mimeType, userInstruction) {
    const apiKey = getNextGeminiApiKey(); // selected once
    if (!apiKey) return null;
    for (const model of VISION_MODELS) {
      ...
      const res = await fetch(url, ...);
      if (!res.ok) continue; // fails over models, but stays on the SAME exhausted key!
      ...
    }
    return null;
  }
  ```
  When an API key encounters HTTP 429/quota exhaustion, it does not rotate to the remaining keys in the pool. It iterates across models with the same exhausted key and returns `null`.
- In `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts:220`:
  When `callGeminiVision` returns `null`, line 220 returns a static mock prescription for `Amoxicillin 500mg` labeled `'Gemini Vision (Edge Fallback)'`.
- In `services/backend/smart-health-platform/backend/src/modules/ai/bricsIntelligenceService.ts:6-8`:
  `getGeminiApiKey()` does not split comma-separated strings, passing `key1,key2,key3` directly as a query parameter when `GEMINI_API_KEYS` is used.

---

## 2. Logic Chain

1. **Database & Coverage**:
   - `01_states.json`, `02_districts.json`, and `03_phc_facilities.json` originally provided 10 canonical states and 120 PHCs.
   - Running `seedAllIndiaPhcs.ts` added the remaining 26 States/UTs, 41 districts, and 58 PHCs.
   - Together with PHC Rampur in Varanasi, UP, the total count in PostgreSQL is verified as 36 States/UTs, 91 districts, and 179 PHCs (Observation 1.2).
2. **Persistence Integrity**:
   - Facility drug inventories, billing logs, and audit logs are backed by real PostgreSQL tables.
   - `BillingService.checkout()` enforces FEFO batch selection and idempotency.
   - However, real-time event streaming has contract mismatches: `/api/v1/events/stream` and `/governance/kpi/stream` are unmapped, and `/api/v1/governance/alerts/stream` requires authorization that browser EventSource cannot fulfill (Observations 1.3 & 1.4).
3. **Route Discrepancies**:
   - The user specification mandates testing `/api/v1/facilities`, `/api/v1/inventory/*`, and `/api/v1/ocr/*`.
   - Inspection of `src/index.ts` proves that `/api/v1/ocr/*` does not exist (implemented as `/api/v1/ai/vision/extract-prescription`), `/api/v1/inventory/*` is split between `/api/v1/phc/:phcId/inventory` and `/api/v1/medicines`, and `/api/v1/facilities` shadows `facilityController` (Observation 1.5).
4. **AI Key Rotation & Error Handling**:
   - The user specification mandates a 3-key Google Gemini API pool with transparent 429/rate-limit error handling.
   - Analysis of `visionService.ts` proves that while comma-delimited `GEMINI_API_KEYS` is parsed, rotation on 429 within a request is absent (it tests 5 models on the same failed key, then triggers a mock fallback) (Observation 1.6).

---

## 3. Caveats

1. Direct execution of arbitrary `node` commands from PowerShell was avoided due to permission prompt timeouts; verification was conducted via native HTTP inspection of live endpoints (`/health`, `/graphql`, `/api/v1/phc/facilities`, `/api/v1/jurisdiction/hierarchy`) and static code analysis of TypeScript modules.
2. The AI Engine on port 5000 was not probed directly as it is auxiliary to the Express/GraphQL backend on port 8000 and PostgreSQL on port 5432.

---

## 4. Conclusion

The backend and PostgreSQL database are fully operational, healthy, and successfully store and serve **179 PHCs across all 36 Indian States and Union Territories**. The database persistence layer correctly tracks drug inventories, FEFO billing transactions, and cryptographic audit logs.

However, three critical areas require remediation by subsequent implementers:
1. **Route Aliasing**:
   - Add route alias `/api/v1/events/stream` pointing to the SSE stream.
   - Add route alias `/api/v1/ocr/*` pointing to `/api/v1/ai/vision/extract-prescription`.
   - Add endpoint `/governance/kpi/stream` (or `/api/v1/governance/kpi/stream`) for the governance portal live KPI ticker.
   - Remove the shadowing `app.get('/api/v1/facilities', ...)` on line 61 of `src/index.ts` so `facilityController` handles filtering properly.
2. **SSE Authentication Fix**:
   - Allow query token auth (`?token=...`) or public read for `GET /api/v1/governance/alerts/stream` and `/api/v1/events/stream` so browser `EventSource` can connect without 401 errors.
3. **Gemini OCR 3-Key Pool & 429 Handling**:
   - In `visionService.ts`, check `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` in addition to `GEMINI_API_KEYS`.
   - Implement an outer loop across keys in `callGeminiVision` so that if a key encounters HTTP 429 or quota errors, it automatically falls over to the next key in the pool before exhausting models.
   - In `bricsIntelligenceService.ts`, correctly parse comma-delimited `GEMINI_API_KEYS`.

---

## 5. Verification Method

To independently verify these findings:
1. **Verify 179 PHCs & 36 States**:
   Send GET to `http://localhost:8000/api/v1/jurisdiction/hierarchy` or `http://localhost:8000/api/v1/phc/facilities`. Confirm `"totalStates": 36`, `"totalPhcs": 179`, `"count": 179`.
2. **Verify Backend Health & GraphQL**:
   Send GET to `http://localhost:8000/health` (returns `{"status":"ok"}`).
   Send GET to `http://localhost:8000/graphql` (returns `{"status":"GraphQL endpoint ready. Use POST /graphql with query payload."}`).
3. **Verify Route Shadowing & Missing Routes**:
   Inspect `services/backend/smart-health-platform/backend/src/index.ts` lines 61, 310, 408, 434. Confirm absence of `/api/v1/events/stream`, absence of `/api/v1/ocr`, and shadowing of `/api/v1/facilities`.
4. **Verify Gemini OCR Key Rotation Logic**:
   Inspect `services/backend/smart-health-platform/backend/src/modules/ai/visionService.ts` lines 64–117. Confirm single-key selection and lack of key retry on `!res.ok` (429).
