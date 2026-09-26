# Backend & Persistence Investigation Report

**Investigation Date:** 2026-09-26T18:38:00Z  
**Investigator:** Explorer 1 (Backend & Persistence)  
**Target System:** Smart Health Platform Backend (`services/backend/smart-health-platform/backend`), PostgreSQL 16 (`smarthealth`), and Portals Interconnect.

---

## 1. Executive Summary

A comprehensive investigation of the central Express backend (port 8000) and PostgreSQL database (port 5432, database `smarthealth`) was executed.

Key findings:
1. **Live Backend & Database Status**: The Express backend is live on port 8000 (PID 31460) and PostgreSQL 16 is live on port 5432 (PID 7884). Both services are healthy and accepting queries.
2. **Nationwide Coverage (179 PHCs across 36 States/UTs)**: PostgreSQL database `smarthealth` contains **exactly 36 Indian States and Union Territories**, **91 Districts**, and **179 Primary Healthcare Centres (PHCs)**, verified via live endpoint query to `/api/v1/jurisdiction/hierarchy` and `/api/v1/phc/facilities`.
3. **Facility Drug Inventories & Transaction Logs**: Live PostgreSQL tables (`inventory_batches`, `medicines`, `billing_transactions`, `dispensed_items`, `audit_log`, `mutation_queue`) are actively populated and integrated into FEFO dispensing and delta sync.
4. **SSE Real-Time Event Streaming**: Real-time alert streaming is implemented at `GET /api/v1/governance/alerts/stream` via `AlertsSseManager`. However, `/api/v1/events/stream` and `/governance/kpi/stream` do not exist as backend routes, and `/api/v1/governance/alerts/stream` requires JWT auth headers that browser `EventSource` cannot send, creating an authentication disconnect for browser clients.
5. **Backend Route Mapping & Discrepancies**:
   - `/health` responds with HTTP 200.
   - `/graphql` responds with HTTP 200 and executes queries against PostgreSQL.
   - `/api/v1/facilities` is shadowed in `index.ts` line 61, blocking `facilityController` (line 310) from processing query parameters like `district_id`.
   - `/api/v1/ocr/*` does not exist; OCR is located exclusively at `/api/v1/ai/vision/extract-prescription`.
6. **Gemini OCR API Key Pool & Rate-Limit Handling**:
   - `visionService.ts` supports comma-separated `GEMINI_API_KEYS`, but does not inspect numbered variables (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`).
   - `visionService.ts` **fails to rotate keys on HTTP 429/rate-limit** within the same request: it selects one key upfront and iterates through models with the same exhausted key, before falling back to a hardcoded edge fallback.
   - Curated samples (`sample_rx_amoxicillin`, `sample_blister_paracetamol`) bypass Google AI vision entirely and return hardcoded static data.
   - `bricsIntelligenceService.ts` lacks key pool parsing altogether (passes raw comma-delimited string as a single key).

---

## 2. PostgreSQL Database & 179 PHCs Verification

### 2.1 Geographic Hierarchy Verification
Querying `GET http://localhost:8000/api/v1/jurisdiction/hierarchy` confirmed the following verified live counts in PostgreSQL `smarthealth`:
- **Total Nations**: 7 (`IN`, `BR`, `RU`, `CN`, `ZA`, `TST`, `AE`)
- **Total States**: 36 (All 28 Indian States and 8 Union Territories)
  - States: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal.
  - Union Territories: Andaman and Nicobar Islands, Chandigarh, Dadra and Nagar Haveli and Daman and Diu, Delhi (NCT), Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry.
- **Total Districts**: 91 canonical districts.
- **Total PHC Facilities**: **179** operational PHCs.

### 2.2 Seeding Lineage
1. **Canonical Seeds (`Desktop/datasets/seeds/output`)**:
   - `01_states.json` originally provided 10 canonical states.
   - `02_districts.json` provided 50 canonical districts.
   - `03_phc_facilities.json` provided 120 PHC facilities.
   - Script `scripts/ingest_canonical_datasets.js` ingested these plus flagship PHC Rampur in Varanasi, UP (`c0000003-0000-0000-0000-000000000099`).
2. **Nationwide Extension (`src/db/seedAllIndiaPhcs.ts`)**:
   - Ingested the remaining 26 States/UTs, 41 additional districts, and 58 additional PHCs.
   - Total count in PostgreSQL: 120 + 1 (Rampur) + 58 = **179 PHCs**.
3. **Portal Facilities Endpoint (`GET /api/v1/phc/facilities`)**:
   - Returns all 179 facilities formatted for portal selection and authentication.
   - Response payload verbatim check: `{"count":179, "facilities": [...]}`.

---

## 3. Facility Drug Inventories, Transaction Logs, and Event Streaming

### 3.1 Facility Drug Inventories
- **Data Model**: `inventory_batches` joined with `medicines` master table.
- **Endpoints**:
  - `GET /api/v1/phc/:phcId/inventory` (RLS protected by tenant context): Returns live inventory batches, remaining quantities, minimum thresholds, and expiry dates.
  - `POST /api/v1/phc/:phcId/inventory`: Ingests new stock with device binding verification.
  - `POST /api/v1/phc/:phcId/inventory/:batchId/adjust`: Performs audit-logged stock adjustments, requiring explicit `reason`, emitting `stock.threshold_breached` if below minimum threshold.
  - `GET /api/v1/phc/:phcId/live-data`: Returns ground-truth hydration payload for Dexie.js offline cache.

### 3.2 Transaction Logs & Audit Trails
- **FEFO Dispensing Ledger**: `billing_transactions` and `dispensed_items` tables enforce First-Expiry-First-Out dispensing.
  - Handled via `BillingService.checkout()` in `modules/billing/billingService.ts`.
  - Idempotent: checks `client_txn_id`; returns HTTP 200 with `already_existed: true` on replay, HTTP 409 on insufficient stock.
- **Tamper-Evident Audit Log**: `audit_log` table with SHA-256 hash chaining.
  - `GET /api/v1/audit/verify` traverses up to 200 entries and validates `this_hash === SHA256(prev_hash + ...)`.
- **Offline Mutation Queue**: `mutation_queue` stores all mutations pushed via `POST /sync/push` with monotonic sequence tracking (`server_seq`).

### 3.3 Real-Time Event Streaming & SSE
- **Event Bus**: In-memory `EventEmitter` in `src/events/eventBus.ts` validating 12 canonical event schemas (Zod).
- **Live SSE Implementation**: Located at `GET /api/v1/governance/alerts/stream` (mounted via `alertsController.ts`).
  - Managed by `AlertsSseManager` which maintains open client connections and broadcasts `alert.created` and `emergency.created` domain events.
  - Includes 25-second heartbeat intervals (`: heartbeat\n\n`).
- **Discrepancy / Broken Contracts**:
  - `GET /api/v1/events/stream` referenced in user requirements does NOT exist.
  - `GET /governance/kpi/stream` referenced in `governance-portal/src/app/governance/page.tsx` does NOT exist.
  - `GET /api/v1/governance/alerts/stream` is guarded by `requireAuth`. Because browser `EventSource` does not support custom authorization headers, frontend connection attempts from browser portals will encounter HTTP 401 Unauthorized unless auth is passed via cookies or query tokens.

---

## 4. Backend Route Status & Diagnostic Matrix

| Route | Method | File / Handler | Status | Observation / Discrepancy |
|---|---|---|---|---|
| `/health` | GET | `src/index.ts:54` | 200 OK | Returns `{"status":"ok","timestamp":"..."}` |
| `/graphql` | GET / POST | `modules/governance/graphqlServer.ts` | 200 OK | Returns schema info on GET; executes all governance/brics queries against PostgreSQL on POST |
| `/api/v1/facilities` | GET | `src/index.ts:61` | 200 (auth) / 401 | **Shadowing issue:** Inline handler at line 61 shadows `facilityController` at line 310; ignores `district_id` query param |
| `/api/v1/phc/facilities` | GET | `modules/phc/phcPortalRoutes.ts:11` | 200 OK | Unauthenticated; returns all 179 PHCs across 36 states/UTs |
| `/api/v1/jurisdiction/hierarchy` | GET | `modules/jurisdiction/jurisdictionController.ts:10` | 200 OK | Unauthenticated; returns nations (7), states (36), districts (91), PHCs (179) |
| `/api/v1/phc/:phcId/inventory` | GET / POST | `modules/inventory/inventoryController.ts:52` | 200 (auth) / 401 | Scoped to PHC; requires JWT and tenant context |
| `/api/v1/inventory/*` | ANY | None | 404 | No generic `/api/v1/inventory/*` route exists; routes are under `/api/v1/phc/:phcId/inventory` and `/api/v1/medicines` |
| `/api/v1/ai/vision/extract-prescription` | POST | `modules/ai/visionService.ts:122` | 200 OK | Operational Gemini Vision endpoint with DB matching |
| `/api/v1/ocr/*` | ANY | None | 404 | No `/api/v1/ocr/*` route mounted; missing alias to `/api/v1/ai/vision/extract-prescription` |
| `/api/v1/governance/alerts/stream` | GET | `modules/alerts/alertsController.ts:29` | 200 (auth) / 401 | Active SSE stream; blocked by `requireAuth` for standard browser `EventSource` |
| `/api/v1/events/stream` | ANY | None | 404 | Missing route; no alias to `/api/v1/governance/alerts/stream` |
| `/governance/kpi/stream` | ANY | None | 404 | Missing route; expected by `governance-portal` KPI ticker |

---

## 5. Google Gemini OCR API Key Pool & Rate-Limit Analysis

### 5.1 Configuration & Key Ingestion
In `modules/ai/visionService.ts`:
```typescript
function getGeminiApiKeys(): string[] {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GOOGLE_AI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysStr.split(',').map((k) => k.trim()).filter(Boolean);
}
```
- **Strengths**: Parses comma-separated key lists from `GEMINI_API_KEYS`.
- **Deficiencies**:
  1. Does not recognize numbered environment variables (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`).
  2. Does not filter invalid format keys or log pool cardinality on startup.

### 5.2 Multi-Key Rotation & 429 Handling Analysis
In `modules/ai/visionService.ts`:
```typescript
async function callGeminiVision(imageBase64, mimeType, userInstruction) {
  const apiKey = getNextGeminiApiKey(); // <-- Selected once
  if (!apiKey) return null;

  for (const model of VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, ...);
      if (!res.ok) continue; // <-- Retries next MODEL, but with the SAME exhausted key!
      ...
    } catch {
      continue;
    }
  }
  return null;
}
```
- **Critical Flaw**:
  When a key receives a `429 Too Many Requests` or `RESOURCE_EXHAUSTED` quota error, the loop continues to test the other 4 models (`gemini-2.0-flash`, `gemini-1.5-flash`, etc.) using the **exact same exhausted API key**. It never rotates to the remaining keys in the pool during that request.
- **Comparison with Copilot Service**:
  `copilotService.ts` correctly implements a two-tier nested loop:
  `for (let k = 0; k < apiKeys.length; k++) { const apiKey = apiKeys[...]; for (const model of CANDIDATE_MODELS) { ... } }`
  `visionService.ts` lacks this outer key loop.

### 5.3 Fallback and Static Mock Behavior
1. **Offline/Exhaustion Edge Fallback**: If all models fail (or key is exhausted), `visionService.ts` line 220 returns a static mock prescription object (`Amoxicillin 500mg, 10 tablets`) with `modelVersion: 'Gemini Vision (Edge Fallback)'`.
2. **Demo Sample Bypass**: If `sampleType === 'sample_rx_amoxicillin'` or `sampleType === 'sample_blister_paracetamol'`, the service completely bypasses Google AI and returns pre-cooked static prescription records.
3. **BRICS Intelligence Single Key Ingestion**:
   In `modules/ai/bricsIntelligenceService.ts`:
   `function getGeminiApiKey(): string { return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEYS || process.env.GEMINI_API_KEYS || ''; }`
   Does not parse comma-delimited keys. Setting `GEMINI_API_KEYS="key1,key2,key3"` causes this service to send `"key1,key2,key3"` as the URL query param, breaking all BRICS AI briefings.

---

## 6. Disconnected Hooks & Mock Fallbacks Identified

1. **Missing Alias for `/api/v1/ocr/*`**:
   The requirement calls for `/api/v1/ocr/*` to respond with HTTP 200. Only `/api/v1/ai/vision/extract-prescription` is mounted. An alias router for `/api/v1/ocr` is needed.
2. **Missing Alias for `/api/v1/events/stream`**:
   The requirement calls for real-time event streaming at `/api/v1/events/stream`. Only `/api/v1/governance/alerts/stream` exists. An alias is needed.
3. **Browser EventSource Authentication Failure**:
   `GET /api/v1/governance/alerts/stream` enforces `requireAuth`. Browser `EventSource` cannot send `Authorization: Bearer` headers, causing the Governance Portal Header and dashboard streams to fail with HTTP 401. An auth bypass for query parameter tokens (`?token=...` or public read) is required.
4. **Missing `/governance/kpi/stream`**:
   `apps/governance-portal/src/app/governance/page.tsx` connects to `/governance/kpi/stream`, which returns 404 from the backend.
5. **Route Shadowing in `index.ts`**:
   `app.get('/api/v1/facilities', ...)` at line 61 shadows `facilityController` at line 310, preventing `district_id` filtering.
6. **Gemini Key Rotation on 429**:
   `visionService.ts` does not retry alternate keys in the pool when an API key receives HTTP 429.
7. **Client-side Mock Fallbacks in Portals**:
   - `apps/governance-portal/src/lib/redistributionData.ts`: falls back to `MOCK_RECOMMENDATIONS`.
   - `apps/governance-portal/src/lib/supplyChainData.ts`: includes `MOCK_SHIPMENTS`.
   - `apps/governance-portal/src/lib/resourceData.ts`: includes mock scaling functions.
   - `apps/brics-portal/src/graphql/mock-data.ts`: retained in repository, though primary client in `client.ts` points to live GraphQL.
