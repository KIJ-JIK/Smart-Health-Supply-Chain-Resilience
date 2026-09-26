# Handoff Report — Challenger 2: Boundary & Route Stress Verifier

## 1. Observation

### 1.1 Challenge 1: Governance Portal Routes Rapid Concurrency Stress Test (Port 3000)
- **Tool / Command**: Executed baseline HTTP probes and 10-concurrent burst stress tests via `challenger_boundary_stress.ts` against all 17 App Router routes on `http://localhost:3000`:
  - `/governance`, `/gis`, `/medicine`, `/resources`, `/workforce`, `/patients`, `/forecasts`, `/early-warnings`, `/analytics`, `/redistribution`, `/supply-chain`, `/emergency`, `/simulator`, `/copilot`, `/audit`, `/admin`, `/manage-jurisdiction`.
- **Observed Metrics**:
  - Baseline: 17 / 17 routes responded with HTTP 200 (latencies: 52ms to 215ms, payload sizes: 37,647 to 81,717 bytes).
  - Rapid Burst Wave (10 concurrent requests simultaneously per route, total 170 requests):
    - `/governance`: 10/10 HTTP 200, Total wave: 541ms, throughput: 18.5 req/s
    - `/gis`: 10/10 HTTP 200, Total wave: 630ms, throughput: 15.9 req/s
    - `/medicine`: 10/10 HTTP 200, Total wave: 390ms, throughput: 25.6 req/s
    - `/resources`: 10/10 HTTP 200, Total wave: 426ms, throughput: 23.5 req/s
    - `/workforce`: 10/10 HTTP 200, Total wave: 370ms, throughput: 27.0 req/s
    - `/patients`: 10/10 HTTP 200, Total wave: 382ms, throughput: 26.2 req/s
    - `/forecasts`: 10/10 HTTP 200, Total wave: 295ms, throughput: 33.9 req/s
    - `/early-warnings`: 10/10 HTTP 200, Total wave: 376ms, throughput: 26.6 req/s
    - `/analytics`: 10/10 HTTP 200, Total wave: 289ms, throughput: 34.6 req/s
    - `/redistribution`: 10/10 HTTP 200, Total wave: 309ms, throughput: 32.4 req/s
    - `/supply-chain`: 10/10 HTTP 200, Total wave: 313ms, throughput: 31.9 req/s
    - `/emergency`: 10/10 HTTP 200, Total wave: 296ms, throughput: 33.8 req/s
    - `/simulator`: 10/10 HTTP 200, Total wave: 247ms, throughput: 40.5 req/s
    - `/copilot`: 10/10 HTTP 200, Total wave: 334ms, throughput: 29.9 req/s
    - `/audit`: 10/10 HTTP 200, Total wave: 473ms, throughput: 21.1 req/s
    - `/admin`: 10/10 HTTP 200, Total wave: 330ms, throughput: 30.3 req/s
    - `/manage-jurisdiction`: 10/10 HTTP 200, Total wave: 330ms, throughput: 30.3 req/s
  - Total: 170 / 170 concurrent requests responded with HTTP 200 (0 errors, 0 dropped connections).

### 1.2 Challenge 2: 36 Indian States/UTs PostgreSQL Topology & GIS Coverage
- **PostgreSQL Database Counts**:
  - `states` table: Exactly 36 records (28 States + 8 Union Territories).
  - `districts` table: 91 records. All 36 states have at least 1 registered district.
  - `phc_facilities` table: 179 records. All 36 states have at least 1 registered PHC facility.
  - Referential Integrity: 0 orphan districts (`SELECT count(*) FROM districts WHERE state_id NOT IN (SELECT id FROM states)` = `0`), 0 orphan facilities (`SELECT count(*) FROM phc_facilities WHERE district_id NOT IN (SELECT id FROM districts) OR state_id NOT IN (SELECT id FROM states)` = `0`).
  - Geographic Sanity: All 179 facilities have valid float coordinates bounded strictly within Indian territorial boundaries (Latitude 6.0° - 38.0° N, Longitude 68.0° - 98.0° E).
  - Central Hierarchy Endpoint (`GET http://localhost:8000/api/v1/jurisdiction/hierarchy`): Returns HTTP 200 with `{ totalStates: 36, totalDistricts: 91, totalPhcs: 179 }`.
  - Frontend GIS Extents (`apps/governance-portal/src/lib/gisData.ts:642-750`): Defines `JURISDICTION_EXTENTS` with camera bounds for individual states and provides a fallback to `national` (`bounds: [[68.1, 6.7], [97.4, 35.5]]`) for any unmapped state/district, preventing WebGL / Deck.gl crashes.

### 1.3 Challenge 3: Dexie Offline Mutation Queueing & Push/Pull Consistency
- **Defect 1: Connection Pool Starvation Deadlock under Concurrent Mutation Errors**:
  - Exact file & lines: `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts:107-170` and `src/db/pool.ts:40-57`.
  - In `pool.ts:54`, `adminPool` is configured with `max: 5` and no `connectionTimeoutMillis`.
  - In `syncService.ts:107`, for each mutation in a push batch:
    ```typescript
    const client = await adminPool.connect();
    try {
      await client.query('BEGIN');
      const mutationResult = await this.executeMutation(client, request.phc_id, request.device_id, m);
      ...
      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => {});
      ...
      // Line 143:
      await adminPool.query(
        `INSERT INTO mutation_queue (...) VALUES (...) ON CONFLICT ...`,
        [...]
      );
      ...
    } finally {
      client.release();
    }
    ```
  - Verbatim Observed Failure: When 5 or more concurrent requests encounter an error (or under race condition), all 5 connections in `adminPool` are held by `await adminPool.connect()` (lines 107). Before reaching `client.release()` in `finally` (line 170), each worker calls `await adminPool.query(...)` at line 143. Because `adminPool.query()` internally attempts to check out an additional connection from the now-exhausted pool (`max: 5`), all workers wait on each other indefinitely.
  - Verification telemetry: `pg_stat_activity` showed all 5 backend connections frozen in `idle` state after executing `ROLLBACK`, while subsequent calls to `/sync/push` and `/sync/pull` timed out after 10000ms.
- **Defect 2: Pull Delta Entity-Type Naming Mismatch Drops Client Sync Updates**:
  - In `syncService.ts:575, 594, 613, 627`, `processPull` emits deltas with:
    - `entity_type: 'redistribution_approval'`
    - `entity_type: 'request_status_change'`
    - `entity_type: 'alert'` (singular)
    - `entity_type: 'facility_config_update'`
  - In `apps/phc-portal/src/hooks/useSyncEngine.ts:52-69`, `applyPullDelta` only checks:
    ```typescript
    if (entity_type === 'system_config') { ... }
    else if (entity_type === 'resource_requests') { ... }
    else if (entity_type === 'alerts') { ... }
    else if (entity_type === 'phc_facilities') { ... }
    ```
  - Because `'alert'` does NOT equal `'alerts'`, and `'request_status_change'` does NOT equal `'resource_requests'`, authoritative alerts and resource request status updates delivered by the server are silently ignored and never stored in Dexie IndexedDB.
- **Defect 3: Pull Delta Queries Ignore `since` Watermark**:
  - In `syncService.ts:564-620`, queries against `redistribution_transfers`, `resource_requests`, and `alerts` contain no `WHERE created_at > since` or `WHERE server_seq > since` clause. Every pull request receives the same static records repeatedly, and hardcodes `server_seq: currentSeq` on each delta.

---

## 2. Logic Chain

1. **Governance Routes Robustness**:
   - Observations in Section 1.1 show that all 17 routes on port 3000 sustain rapid concurrent bursts with 100% HTTP 200 responses and sub-second latencies under load. Next.js App Router and server rendering are solid.
2. **PostgreSQL & GIS Topology Integrity**:
   - Observations in Section 1.2 demonstrate that PostgreSQL `smarthealth` contains all 36 States/UTs, 91 canonical districts, and 179 geocoded facilities with unbroken referential integrity and valid coordinate bounding.
3. **Dexie Offline Sync Deadlock**:
   - From Section 1.3, `adminPool` has a hard ceiling of 5 connections.
   - When offline sync push requests fail (due to payload error, FK constraint, or validation), the `client` acquired at line 107 is held open while line 143 invokes `adminPool.query()`.
   - When concurrency reaches 5, a circular wait deadlock occurs: `adminPool.query()` waits for a free connection from `adminPool`, while `client.release()` waits for `adminPool.query()` to return.
   - This brings down the entire offline synchronization subsystem, causing all subsequent `/sync/push` and `/sync/pull` operations to hang indefinitely.
4. **Client-Server Contract Broken**:
   - The string mismatch between backend `syncService.ts` (`alert`, `request_status_change`) and frontend Dexie `useSyncEngine.ts` (`alerts`, `resource_requests`) violates the data propagation requirement (R2 / R3), as edge clinics never apply incoming outbreak alerts or request approvals.

---

## 3. Caveats

- Individual sequential mutations on `/sync/push` with valid payloads succeed when concurrency is 1. The deadlock specifically triggers under concurrent error states (concurrency ≥ 5).
- Single-state GIS drilldown displays correct facilities, but full nationwide interactive rendering in WebGL requires MapLibre canvas initialization in an active browser session.

---

## 4. Conclusion

**Verdict: REJECT ❌**

While Challenge 1 (16 Governance Routes) and Challenge 2 (36 States/UTs PostgreSQL & GIS Topology) passed completely, **Challenge 3 (Dexie Offline Mutation Queue)** failed with two significant defects:
1. **Critical connection pool starvation deadlock** in `syncService.ts` that freezes `/sync/push` and `/sync/pull` under concurrent error conditions.
2. **Schema contract mismatch** in `useSyncEngine.ts` where plural/singular entity type discrepancies (`alerts` vs `alert`, `resource_requests` vs `request_status_change`) cause Dexie IndexedDB to silently discard authoritative server updates.

### Required Remediations Before Approval:
1. In `syncService.ts:137-170`, release `client` before calling `adminPool.query`, or use the already-acquired `client` to record the rejected mutation. Furthermore, set `connectionTimeoutMillis` and increase pool size in `pool.ts:54`.
2. In `apps/phc-portal/src/hooks/useSyncEngine.ts:52-69`, harmonize delta entity types to handle `'alert' | 'alerts'` and `'request_status_change' | 'resource_requests'`.
3. In `syncService.ts:560-630`, add `WHERE created_at > ...` or sequence filtering using the `since` parameter so delta pulls are truly incremental.

---

## 5. Verification Method

To independently reproduce and verify these findings:

1. **Run Challenger Stress Suite**:
   ```powershell
   cd c:\Users\anshv\OneDrive\Desktop\Smart_governance\services\backend\smart-health-platform\backend
   npx ts-node tests/challenger_boundary_stress.ts
   ```
2. **Observe Concurrency Deadlock in PostgreSQL**:
   ```powershell
   node -e "const { Pool } = require('pg'); const p = new Pool({ host: 'localhost', database: 'smarthealth', user: 'postgres', password: 'postgres'}); p.query('SELECT pid, state, query FROM pg_stat_activity WHERE datname = \'smarthealth\'').then(r => { console.log(r.rows); return p.end(); });"
   ```
   *Expected outcome:* 5 connections stuck in `idle` with `ROLLBACK` after concurrent failed mutations, starving `adminPool`.
3. **Inspect Entity Type Mismatch**:
   - Compare `syncService.ts` line 613 (`entity_type: 'alert'`) vs `useSyncEngine.ts` line 63 (`else if (entity_type === 'alerts')`).
