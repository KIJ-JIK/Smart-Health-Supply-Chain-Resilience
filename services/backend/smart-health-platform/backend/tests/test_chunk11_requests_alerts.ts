/**
 * test_chunk11_requests_alerts.ts
 *
 * Integration test suite for Chunk 11:
 *   - Request lifecycle state machine (Prompt 12)
 *   - Decision-authority enforcement (district_admin+ only)
 *   - Emergency fast-path alert creation
 *   - Alerts risk-scoring engine (Prompt 13)
 *   - SSE manager fan-out
 *   - Event-bus → alerts wiring
 *
 * All tests run against the mock-DB/in-memory event bus — no live Postgres needed.
 */

import { EventEmitter } from 'events';

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight mock infrastructure (same pattern as chunk10 tests)
// ─────────────────────────────────────────────────────────────────────────────

interface MockRow {
  id: string;
  phc_id?: string;
  district_id?: string;
  state_id?: string;
  request_type?: string;
  item_ref?: string;
  quantity?: number;
  priority?: string;
  reason?: string;
  source?: string;
  status?: string;
  created_at?: string;
  decided_at?: string;
  decided_by?: string;
  notes?: string;
  alert_type?: string;
  severity?: string;
  payload?: any;
  risk_score?: number;
  [key: string]: any;
}

class MockQueryResult {
  rows: MockRow[];
  rowCount: number;
  constructor(rows: MockRow[]) {
    this.rows = rows;
    this.rowCount = rows.length;
  }
}

type QueryFn = (text: string, values?: any[]) => Promise<MockQueryResult>;

// In-memory stores
const requestStore: MockRow[] = [];
const alertStore:   MockRow[] = [];
let   idCounter = 1;

function genId(): string { return `test-id-${idCounter++}`; }

// ─────────────────────────────────────────────────────────────────────────────
// Build request mock client
// ─────────────────────────────────────────────────────────────────────────────
function buildRequestQueryFn(): QueryFn {
  return async (text: string, values: any[] = []) => {
    const t = text.trim().toUpperCase();

    // INSERT resource_request
    if (t.startsWith('INSERT INTO RESOURCE_REQUESTS')) {
      const row: MockRow = {
        id:           genId(),
        phc_id:       values[0],
        request_type: values[1],
        item_ref:     values[2],
        quantity:     values[3],
        priority:     values[4],
        reason:       values[5],
        source:       'manual',
        status:       'pending',
        notes:        values[6] || null,
        created_at:   new Date().toISOString(),
      };
      requestStore.push(row);
      return new MockQueryResult([row]);
    }

    // SELECT resource_request by id + phc_id
    if (t.startsWith('SELECT') && t.includes('RESOURCE_REQUESTS WHERE ID')) {
      const [reqId, phcId] = values;
      const found = requestStore.filter(r => r.id === reqId && r.phc_id === phcId);
      return new MockQueryResult(found);
    }

    // SELECT resource_requests list
    if (t.startsWith('SELECT') && t.includes('RESOURCE_REQUESTS') && t.includes('WHERE PHC_ID')) {
      const rows = requestStore.filter(r => r.phc_id === values[0]);
      return new MockQueryResult(rows);
    }

    // UPDATE resource_request status
    if (t.startsWith('UPDATE RESOURCE_REQUESTS')) {
      const [status, decidedAt, decidedBy, notes, reqId] = values;
      const idx = requestStore.findIndex(r => r.id === reqId);
      if (idx >= 0) {
        requestStore[idx] = {
          ...requestStore[idx],
          status,
          decided_at: decidedAt,
          decided_by: decidedBy,
          notes:      notes || requestStore[idx].notes,
        };
        return new MockQueryResult([requestStore[idx]]);
      }
      return new MockQueryResult([]);
    }

    // SELECT phc_facilities
    if (t.includes('PHC_FACILITIES WHERE ID')) {
      return new MockQueryResult([{ id: values[0], district_id: 'dist-001', state_id: 'state-001' }]);
    }

    // INSERT alerts (from emergency fast-path / createAlert)
    if (t.startsWith('INSERT INTO ALERTS')) {
      const isEmergencyFastpath = t.includes("'EMERGENCY_REPORT'");
      const row: MockRow = isEmergencyFastpath
        ? {
            id:          genId(),
            phc_id:      values[0],
            district_id: values[1],
            state_id:    values[2],
            alert_type:  'emergency_report',
            severity:    'critical',
            payload:     typeof values[3] === 'string' ? JSON.parse(values[3]) : values[3],
            status:      'open',
            risk_score:  1.0,
            created_at:  new Date().toISOString(),
          }
        : {
            id:          genId(),
            phc_id:      values[0],
            district_id: values[1],
            state_id:    values[2],
            alert_type:  values[3],
            severity:    values[4],
            payload:     typeof values[5] === 'string' ? JSON.parse(values[5]) : values[5],
            status:      'open',
            risk_score:  values[6] || 1.0,
            created_at:  new Date().toISOString(),
          };
      alertStore.push(row);
      return new MockQueryResult([row]);
    }

    // SELECT alerts
    if (t.startsWith('SELECT') && t.includes('FROM ALERTS')) {
      return new MockQueryResult([...alertStore]);
    }

    // SET CONFIG (RLS context)
    if (t.startsWith('SELECT SET_CONFIG') || t.startsWith('BEGIN') || t.startsWith('COMMIT') || t.startsWith('ROLLBACK')) {
      return new MockQueryResult([]);
    }

    return new MockQueryResult([]);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Patch DB pool
// ─────────────────────────────────────────────────────────────────────────────
const mockQueryFn = buildRequestQueryFn();

const mockClient = {
  query: mockQueryFn,
  release: () => {},
};

const mockPool = {
  connect: async () => mockClient,
  query:   mockQueryFn,
  on:      () => {},
};

// Monkey-patch require resolution for pool
const Module = require('module');
const originalLoad = (Module as any)._load.bind(Module);
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request.endsWith('db/pool') || request.includes('db/pool')) {
    return {
      pool:      mockPool,
      adminPool: mockPool,
      withTenantContext: async (claims: any, fn: any) => {
        return fn(mockClient);
      },
    };
  }
  return originalLoad(request, parent, isMain);
};

// ─────────────────────────────────────────────────────────────────────────────
// Load modules under test AFTER patching
// ─────────────────────────────────────────────────────────────────────────────
const { RequestService } = require('../src/modules/request/requestService') as typeof import('../src/modules/request/requestService');
const { AlertsService, AlertsSseManager } = require('../src/modules/alerts/alertsService') as typeof import('../src/modules/alerts/alertsService');
const { eventBus } = require('../src/events/eventBus') as typeof import('../src/events/eventBus');

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
    failures.push(label);
  }
}

async function run(label: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n▶ ${label}`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`  💥 Threw: ${err.message}`);
    failed++;
    failures.push(`${label} — threw: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 11 Integration Test Suite: Request Lifecycle & Alerts Engine');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const phcClaims   = { role: 'phc_user'       as const, phcId: 'phc-001', sub: 'user-phc' };
  const distAdmin   = { role: 'district_admin' as const, districtId: 'dist-001', sub: 'user-da' };
  const stateAdmin  = { role: 'state_admin'    as const, stateId: 'state-001', sub: 'user-sa' };

  // ── 1. Create a resource request ──────────────────────────────────────────────
  let createdRequestId = '';
  await run('1. PHC user creates a resource request', async () => {
    const req = await RequestService.createRequest(phcClaims, 'phc-001', {
      request_type: 'medicine',
      item_ref:     'med-paracetamol',
      quantity:     50,
      priority:     'urgent',
      reason:       'manual',
    });
    assert(req.id !== undefined,            'request has id');
    assert(req.status === 'pending',        'initial status is pending');
    assert(req.priority === 'urgent',       'priority mapped correctly');
    assert(req.request_type === 'medicine', 'request_type stored');
    createdRequestId = req.id;
  });

  // ── 2. PHC user CANNOT approve own request ────────────────────────────────────
  await run('2. PHC user cannot approve (403 authority check)', async () => {
    let caught = false;
    try {
      await RequestService.transitionStatus(phcClaims, 'phc-001', createdRequestId, 'approved');
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 403, '403 status code on authority failure');
      assert(err.message.includes('FORBIDDEN'), 'message says FORBIDDEN');
    }
    assert(caught, 'exception was thrown for unauthorized approval');
  });

  // ── 3. District admin approves request ───────────────────────────────────────
  await run('3. District admin approves request (valid transition)', async () => {
    const updated = await RequestService.transitionStatus(
      distAdmin, 'phc-001', createdRequestId, 'approved', { notes: 'Stock confirmed' },
    );
    assert(updated.status === 'approved',       'status transitioned to approved');
    assert(updated.decided_by === 'user-da',    'decided_by set from claims.sub');
    assert(updated.decided_at !== undefined,    'decided_at populated');
  });

  // ── 4. Valid transition chain: approved → dispatched → in_transit → delivered
  await run('4. Full dispatch chain: approved → dispatched → in_transit → delivered', async () => {
    const r1 = await RequestService.transitionStatus(distAdmin, 'phc-001', createdRequestId, 'dispatched');
    assert(r1.status === 'dispatched', 'dispatched');

    const r2 = await RequestService.transitionStatus(distAdmin, 'phc-001', createdRequestId, 'in_transit');
    assert(r2.status === 'in_transit', 'in_transit');

    const r3 = await RequestService.transitionStatus(distAdmin, 'phc-001', createdRequestId, 'delivered');
    assert(r3.status === 'delivered', 'delivered');
  });

  // ── 5. Invalid transition rejected ────────────────────────────────────────────
  await run('5. Invalid transition from delivered → approved rejected (422)', async () => {
    let caught = false;
    try {
      await RequestService.transitionStatus(distAdmin, 'phc-001', createdRequestId, 'approved');
    } catch (err: any) {
      caught = true;
      assert(err.statusCode === 422, '422 on invalid transition');
      assert(err.message.includes('INVALID_TRANSITION'), 'error message clarity');
    }
    assert(caught, 'invalid transition throws');
  });

  // ── 6. PHC user cancels their own pending request ────────────────────────────
  let pendingForCancel = '';
  await run('6. PHC user self-cancels a pending request', async () => {
    const req = await RequestService.createRequest(phcClaims, 'phc-001', {
      request_type: 'oxygen',
      quantity: 5,
      priority: 'critical',
    });
    pendingForCancel = req.id;
    // Reset status to pending for cancel test
    const pending = requestStore.find(r => r.id === pendingForCancel);
    if (pending) pending.status = 'pending';

    const result = await RequestService.cancelRequest(phcClaims, 'phc-001', pendingForCancel);
    assert(result.status === 'rejected', 'cancel sets status to rejected');
    assert(result.id === pendingForCancel, 'cancel returns correct id');
  });

  // ── 7. request.created event emitted on create ───────────────────────────────
  await run('7. request.created event emitted on create', async () => {
    let eventFired = false;
    const unsub = eventBus.subscribe('request.created', () => { eventFired = true; });

    await RequestService.createRequest(phcClaims, 'phc-001', {
      request_type: 'bed',
      quantity: 2,
      priority: 'routine',
    });

    // setImmediate fires after current async chain
    await new Promise((r) => setImmediate(r));
    assert(eventFired, 'request.created event fired');
    unsub();
  });

  // ── 8. Emergency report creates CRITICAL alert and emits events ──────────────
  await run('8. Emergency fast-path: alert created and events emitted', async () => {
    let emergencyFired = false;
    let alertFired     = false;

    const u1 = eventBus.subscribe('emergency.created', () => { emergencyFired = true; });
    const u2 = eventBus.subscribe('alert.created',     () => { alertFired     = true; });

    const alert = await RequestService.reportEmergency(phcClaims, 'phc-001', {
      alert_type: 'emergency_report',
      title:      'Critical medicine shortage',
      description: 'All paracetamol exhausted, 40 patients affected',
    });

    // Emergency path uses synchronous publish (no setImmediate), so events fire before next tick
    await new Promise((r) => setImmediate(r));

    assert(alert.alert_type === 'emergency_report', 'alert_type is emergency_report');
    assert(alert.severity   === 'critical',          'severity is critical');
    assert(emergencyFired, 'emergency.created event fired');
    assert(alertFired,     'alert.created event fired');

    u1(); u2();
  });

  // ── 9. Risk scoring engine ────────────────────────────────────────────────────
  await run('9. Risk score computation and level thresholds', async () => {
    // Full shortage, no consumption accel, no emergency → HIGH
    const s1 = AlertsService.computeRiskScore(1.0, 0, 0);
    assert(s1 === 0.5, `shortage_risk=1 → score=0.5 (got ${s1})`);
    assert(AlertsService.scoreToLevel(s1) === 'HIGH', 'score 0.5 → HIGH');

    // All max
    const s2 = AlertsService.computeRiskScore(1.0, 1.0, 1.0);
    assert(s2 === 1.0, `all max → score=1.0 (got ${s2})`);
    assert(AlertsService.scoreToLevel(s2) === 'CRITICAL', 'score 1.0 → CRITICAL');

    // Low risk
    const s3 = AlertsService.computeRiskScore(0.1, 0.1, 0.1);
    assert(s3 < 0.25, `low inputs → score < 0.25 (got ${s3})`);
    assert(AlertsService.scoreToLevel(s3) === 'LOW', 'low score → LOW');

    // MODERATE
    const s4 = AlertsService.computeRiskScore(0.5, 0.3, 0.2);
    assert(AlertsService.scoreToLevel(s4) === 'MODERATE' || AlertsService.scoreToLevel(s4) === 'HIGH',
      `moderate inputs → MODERATE/HIGH (got ${AlertsService.scoreToLevel(s4)})`);
  });

  // ── 10. stock.threshold_breached → alert in store ────────────────────────────
  await run('10. stock.threshold_breached event creates alert record', async () => {
    const beforeCount = alertStore.length;

    // Register consumers on the live eventBus
    AlertsService.registerEventConsumers();

    // Fire the event
    await eventBus.publish('stock.threshold_breached', {
      phc_id:          'phc-001',
      medicine_id:     'med-001',
      remaining_qty:   3,
      minimum_threshold: 20,
    }, 'test');

    // Consumer is async — wait for DB write
    await new Promise((r) => setTimeout(r, 50));

    assert(alertStore.length > beforeCount, 'alert inserted for stock threshold breach');
    const latest = alertStore[alertStore.length - 1];
    assert(latest.alert_type === 'stock_threshold_breached', 'correct alert_type');
  });

  // ── 11. SSE manager fan-out ───────────────────────────────────────────────────
  await run('11. SSE manager broadcasts to all connected clients', async () => {
    const written: string[] = [];
    const mockRes = {
      write: (chunk: string) => { written.push(chunk); },
    } as any;

    AlertsSseManager.add('client-A', mockRes);
    AlertsSseManager.add('client-B', mockRes);
    assert(AlertsSseManager.count() >= 2, 'two clients registered');

    AlertsSseManager.broadcast({ alert_type: 'test', severity: 'HIGH' });
    assert(written.length >= 2, `broadcast reached ${written.length} client(s)`);
    assert(written[0].includes('alert_type'), 'broadcast payload contains alert_type');

    AlertsSseManager.remove('client-A');
    AlertsSseManager.remove('client-B');
    assert(AlertsSseManager.count() === 0, 'clients removed after disconnect');
  });

  // ── 12. alert.created event fires SSE broadcast ──────────────────────────────
  await run('12. alert.created event → SSE fan-out pipeline', async () => {
    const received: any[] = [];
    const mockRes = {
      write: (chunk: string) => { received.push(JSON.parse(chunk.replace('data: ', '').trim())); },
    } as any;
    AlertsSseManager.add('sse-test-client', mockRes);

    // Register consumers so alert.created → broadcast wiring is active
    AlertsService.registerEventConsumers();

    await eventBus.publish('alert.created', {
      id: 'alert-xyz',
      severity: 'CRITICAL',
      alert_type: 'emergency_report',
    }, 'test');

    await new Promise((r) => setTimeout(r, 30));

    assert(received.length > 0, 'SSE client received broadcast from alert.created event');
    if (received.length > 0) {
      assert(received[0].id === 'alert-xyz' || received[0].severity === 'CRITICAL', 'payload integrity preserved in SSE');
    }

    AlertsSseManager.remove('sse-test-client');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`Chunk 11 Tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error('\nFailed assertions:');
    failures.forEach((f) => console.error(`  • ${f}`));
    process.exit(1);
  } else {
    console.log('All Chunk 11 tests passed ✅');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
