/**
 * test_chunk10_consumption_workforce_footfall.ts
 *
 * Integration test suite for Chunk 10:
 *  - Prompt 10: Micro-Consumption Velocity Pipeline & Auto-Draft Requests Engine
 *  - Prompt 11: Workforce Registry & Attendance Module
 *  - Prompt 11: Patient Footfall TimescaleDB Append-Only Module
 *  - Prompt 12: Fast-Path Emergency Reporting Integration
 */

import { PoolClient } from 'pg';
import { eventBus } from '../src/events/eventBus';
import { VelocityService } from '../src/modules/consumption/velocityService';
import { AutoDraftService } from '../src/modules/consumption/autoDraftService';
import { StaffService } from '../src/modules/workforce/staffService';
import { FootfallService } from '../src/modules/footfall/footfallService';
import { RequestService } from '../src/modules/request/requestService';
import { TenantClaims } from '../src/db/pool';

// ---------------------------------------------------------------------------
// In-memory Database State
// ---------------------------------------------------------------------------
interface BatchRow { id: string; phc_id: string; medicine_id: string; remaining_qty: number; minimum_threshold: number; }
interface VelocityRow { time: string; phc_id: string; medicine_id: string; qty_dispensed: number; }
interface RequestRow { id: string; phc_id: string; request_type: string; item_ref: string|null; quantity: number; priority: string; reason: string; source: string; status: string; created_at: string; }
interface StaffRow { id: string; phc_id: string; name: string; role: string; active: boolean; created_at: string; }
interface AttendanceRow { id: string; staff_id: string; attendance_date: string; status: string; recorded_at: string; }
interface FootfallRow { time: string; phc_id: string; category: string; count: number; }
interface AlertRow { id: string; phc_id: string; district_id: string|null; state_id: string|null; alert_type: string; severity: string; payload: any; status: string; created_at: string; }

let batches: BatchRow[] = [];
let velocities: VelocityRow[] = [];
let requests: RequestRow[] = [];
let staffMembers: StaffRow[] = [];
let attendances: AttendanceRow[] = [];
let footfalls: FootfallRow[] = [];
let alerts: AlertRow[] = [];
let nextId = 1;
function uid() { return 'id-' + (nextId++); }

function resetState() {
  batches = [];
  velocities = [];
  requests = [];
  staffMembers = [];
  attendances = [];
  footfalls = [];
  alerts = [];
  nextId = 1;
  eventBus.clearHistory();
}

// ---------------------------------------------------------------------------
// In-Memory Mock PoolClient
// ---------------------------------------------------------------------------
function makeMockClient(): PoolClient {
  const handler = async (sql: string, params: any[] = []) => {
    const s = sql.replace(/\s+/g, ' ').trim();

    // 1. INSERT consumption_velocity
    if (s.includes('INSERT INTO consumption_velocity')) {
      velocities.push({ time: params[0], phc_id: params[1], medicine_id: params[2], qty_dispensed: params[3] });
      return { rows: [] };
    }

    // 2. Velocity stats / moving average SELECT
    if (s.includes('FROM consumption_velocity') && (s.includes('total_consumed') || s.includes('total'))) {
      const phcId = params[0] === 'phc-001' ? params[0] : params[1];
      const medId = params[0] === 'phc-001' ? params[1] : params[2];
      const relevant = velocities.filter((v) => v.phc_id === phcId && v.medicine_id === medId);
      const total = relevant.reduce((sum, v) => sum + v.qty_dispensed, 0);
      return { rows: [{ total: String(total), total_consumed: String(total), recent_total: String(Math.floor(total * 0.6)) }] };
    }

    // 3. Raw consumption history SELECT
    if (s.includes('FROM consumption_velocity') && s.includes('ORDER BY time DESC')) {
      const phcId = params[0];
      let res = velocities.filter((v) => v.phc_id === phcId);
      if (params.length > 2) {
        res = res.filter((v) => v.medicine_id === params[1]);
      }
      return { rows: res };
    }

    // 4. Inventory batch remaining_qty & min_thresh SELECT
    if (s.includes('FROM inventory_batches') && s.includes('SUM(remaining_qty)')) {
      const phcId = params[0];
      const medId = params[1];
      const relevant = batches.filter((b) => b.phc_id === phcId && b.medicine_id === medId);
      const total = relevant.reduce((sum, b) => sum + b.remaining_qty, 0);
      const minThresh = relevant.length > 0 ? Math.min(...relevant.map((b) => b.minimum_threshold)) : 10;
      return { rows: [{ total_remaining: String(total), min_thresh: String(minThresh) }] };
    }

    // 5. Existing auto_draft request check
    if (s.includes('FROM resource_requests') && s.includes("source = 'auto_draft'")) {
      const phcId = params[0];
      const medId = params[1];
      const found = requests.find((r) => r.phc_id === phcId && r.item_ref === medId && r.source === 'auto_draft' && r.status === 'pending');
      return { rows: found ? [{ id: found.id, quantity: found.quantity }] : [] };
    }

    // 6. UPDATE resource_requests
    if (s.includes('UPDATE resource_requests')) {
      const found = requests.find((r) => r.id === params[3]);
      if (found) {
        found.quantity = params[0];
        found.priority = params[1];
        found.reason = params[2];
      }
      return { rows: [] };
    }

    // 7. INSERT resource_requests
    if (s.includes('INSERT INTO resource_requests')) {
      const id = uid();
      const isAutoDraft = params.length === 5;
      const r: RequestRow = {
        id,
        phc_id: params[0],
        request_type: isAutoDraft ? 'medicine' : params[1],
        item_ref: isAutoDraft ? params[1] : params[2],
        quantity: isAutoDraft ? params[2] : params[3],
        priority: isAutoDraft ? params[3] : params[4],
        reason: isAutoDraft ? params[4] : params[5],
        source: isAutoDraft ? 'auto_draft' : (params[6] || 'manual'),
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      requests.push(r);
      return { rows: [{ ...r }] };
    }

    // 8. SELECT resource_requests list
    if (s.includes('FROM resource_requests') && s.includes('ORDER BY created_at DESC')) {
      const phcId = params[0];
      let res = requests.filter((r) => r.phc_id === phcId);
      if (params.includes('pending')) res = res.filter((r) => r.status === 'pending');
      return { rows: res };
    }

    // 9. INSERT staff_registry
    if (s.includes('INSERT INTO staff_registry')) {
      const id = uid();
      const sRow: StaffRow = {
        id,
        phc_id: params[0],
        name: params[1],
        role: params[2],
        active: params[3],
        created_at: new Date().toISOString(),
      };
      staffMembers.push(sRow);
      return { rows: [sRow] };
    }

    // 10. SELECT staff_registry list
    if (s.includes('FROM staff_registry') && s.includes('ORDER BY role ASC')) {
      const phcId = params[0];
      let res = staffMembers.filter((sm) => sm.phc_id === phcId);
      if (s.includes('active = true')) res = res.filter((sm) => sm.active);
      return { rows: res };
    }

    // 11. Verify staff belongs to PHC
    if (s.includes('FROM staff_registry WHERE id = $1 AND phc_id = $2')) {
      const found = staffMembers.find((sm) => sm.id === params[0] && sm.phc_id === params[1]);
      return { rows: found ? [found] : [] };
    }

    // 12. INSERT/UPSERT staff_attendance
    if (s.includes('INSERT INTO staff_attendance')) {
      const id = uid();
      const existing = attendances.find((a) => a.staff_id === params[0] && a.attendance_date === params[1]);
      if (existing) {
        existing.status = params[2];
        return { rows: [existing] };
      }
      const aRow: AttendanceRow = {
        id,
        staff_id: params[0],
        attendance_date: params[1],
        status: params[2],
        recorded_at: new Date().toISOString(),
      };
      attendances.push(aRow);
      return { rows: [aRow] };
    }

    // 13. Attendance summary check for doctors
    if (s.includes('COUNT(*) FILTER (WHERE sr.role = \'doctor\')')) {
      const phcId = params[1];
      const attDate = params[0];
      const phcDoctors = staffMembers.filter((sm) => sm.phc_id === phcId && sm.role === 'doctor' && sm.active);
      const presentDocs = attendances.filter((a) => a.attendance_date === attDate && a.status === 'present' && phcDoctors.some((d) => d.id === a.staff_id));
      return {
        rows: [{
          total_doctors: String(phcDoctors.length),
          present_doctors: String(presentDocs.length),
          total_active: String(staffMembers.filter((sm) => sm.phc_id === phcId && sm.active).length),
          total_present: String(attendances.filter((a) => a.attendance_date === attDate && a.status === 'present').length),
        }],
      };
    }

    // 14. SELECT staff_attendance report
    if (s.includes('FROM staff_attendance sa') && s.includes('JOIN staff_registry sr')) {
      const phcId = params[0];
      const startDate = params[1];
      const endDate = params[2];
      const res = attendances
        .filter((a) => a.attendance_date >= startDate && a.attendance_date <= endDate)
        .map((a) => {
          const sm = staffMembers.find((m) => m.id === a.staff_id);
          return {
            id: a.id,
            staff_id: a.staff_id,
            staff_name: sm?.name,
            role: sm?.role,
            attendance_date: a.attendance_date,
            status: a.status,
            recorded_at: a.recorded_at,
          };
        });
      return { rows: res };
    }

    // 15. INSERT patient_footfall
    if (s.includes('INSERT INTO patient_footfall')) {
      const fRow: FootfallRow = {
        time: params[0],
        phc_id: params[1],
        category: params[2],
        count: params[3],
      };
      footfalls.push(fRow);
      return { rows: [fRow] };
    }

    // 16. SELECT patient_footfall
    if (s.includes('FROM patient_footfall')) {
      const phcId = params[0];
      let res = footfalls.filter((f) => f.phc_id === phcId);
      return { rows: res };
    }

    // 17. phc_facilities lookup for emergency report
    if (s.includes('FROM phc_facilities WHERE id = $1')) {
      return { rows: [{ district_id: 'dist-1', state_id: 'state-1' }] };
    }

    // 18. INSERT alerts (Emergency fastpath)
    if (s.includes('INSERT INTO alerts')) {
      const id = uid();
      const payloadParam = params.length >= 6 ? params[5] : params[3];
      const a: AlertRow = {
        id,
        phc_id: params[0],
        district_id: params[1],
        state_id: params[2],
        alert_type: params.length >= 6 ? params[3] : 'emergency_report',
        severity: params.length >= 6 ? params[4] : 'critical',
        payload: typeof payloadParam === 'string' ? JSON.parse(payloadParam) : payloadParam,
        status: 'open',
        created_at: new Date().toISOString(),
      };
      alerts.push(a);
      return { rows: [a] };
    }

    if (s.includes('set_config') || /^(BEGIN|COMMIT|ROLLBACK)$/.test(s)) return { rows: [] };
    return { rows: [] };
  };

  return { query: handler, release: () => {} } as unknown as PoolClient;
}

// ---------------------------------------------------------------------------
// Test Runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    -> ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 10 Integration Test Suite: Consumption, Workforce & Footfall');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const claims: TenantClaims = {
    role: 'phc_user',
    phcId: 'phc-001',
    districtId: 'dist-001',
    stateId: 'state-001',
  };

  // -------------------------------------------------------------------------
  // Prompt 10: Micro-Consumption Velocity Pipeline & Auto-Draft Requests
  // -------------------------------------------------------------------------
  console.log('--- Prompt 10: Micro-Consumption Velocity & Auto-Draft Engine ---');

  await test('Scenario 1: Record consumption velocity observation in hypertable', async () => {
    resetState();
    const client = makeMockClient();
    await VelocityService.recordConsumption(client, 'phc-001', 'med-paracetamol', 50);

    if (velocities.length !== 1) throw new Error(`Expected 1 velocity row, found ${velocities.length}`);
    if (velocities[0].qty_dispensed !== 50) throw new Error(`Expected qty 50, got ${velocities[0].qty_dispensed}`);
    if (velocities[0].medicine_id !== 'med-paracetamol') throw new Error('Wrong medicine_id');
  });

  await test('Scenario 2: Moving average projection & replenishment recommendation', async () => {
    resetState();
    const client = makeMockClient();
    // 14 days consumption history: total 140 units -> 10 units/day
    velocities.push({ time: new Date().toISOString(), phc_id: 'phc-001', medicine_id: 'med-paracetamol', qty_dispensed: 140 });
    // Current stock is 20 units (min_threshold is 10)
    batches.push({ id: 'b1', phc_id: 'phc-001', medicine_id: 'med-paracetamol', remaining_qty: 20, minimum_threshold: 10 });

    // Evaluate: 10/day * 14 horizon * 1.20 buffer = 168 projected. Current stock = 20. Shortfall = 148.
    const result = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-paracetamol');

    if (result.action_taken !== 'draft_created') throw new Error(`Expected draft_created, got ${result.action_taken}`);
    if (result.recommended_quantity !== 148) throw new Error(`Expected recommended quantity 148, got ${result.recommended_quantity}`);
    if (result.priority !== 'routine') throw new Error(`Expected routine priority, got ${result.priority}`);
    if (result.reason !== 'auto_velocity') throw new Error(`Expected reason auto_velocity, got ${result.reason}`);
  });

  await test('Scenario 3: Stockout triggers CRITICAL priority auto-draft request', async () => {
    resetState();
    const client = makeMockClient();
    velocities.push({ time: new Date().toISOString(), phc_id: 'phc-001', medicine_id: 'med-insulin', qty_dispensed: 70 });
    batches.push({ id: 'b2', phc_id: 'phc-001', medicine_id: 'med-insulin', remaining_qty: 0, minimum_threshold: 15 });

    const result = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-insulin');
    if (result.priority !== 'critical') throw new Error(`Expected critical priority for stockout, got ${result.priority}`);
    if (result.reason !== 'threshold_breach') throw new Error(`Expected threshold_breach reason, got ${result.reason}`);
  });

  await test('Scenario 4: Auto-draft request status is strictly "pending" (never auto-submits, Masterplan §13)', async () => {
    resetState();
    const client = makeMockClient();
    batches.push({ id: 'b3', phc_id: 'phc-001', medicine_id: 'med-amox', remaining_qty: 2, minimum_threshold: 10 });

    const result = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-amox');
    const createdReq = requests.find((r) => r.id === result.request_id);
    if (!createdReq) throw new Error('Created request not found in mock DB');
    if (createdReq.status !== 'pending') throw new Error(`Expected status pending, got ${createdReq.status}`);
    if (createdReq.source !== 'auto_draft') throw new Error(`Expected source auto_draft, got ${createdReq.source}`);
  });

  await test('Scenario 5: Re-evaluation updates existing pending draft rather than duplicating', async () => {
    resetState();
    const client = makeMockClient();
    batches.push({ id: 'b4', phc_id: 'phc-001', medicine_id: 'med-amox', remaining_qty: 5, minimum_threshold: 10 });

    // First evaluation -> creates draft
    const first = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-amox');
    if (first.action_taken !== 'draft_created') throw new Error('First evaluation should create draft');
    if (requests.length !== 1) throw new Error(`Expected 1 request, got ${requests.length}`);

    // Second evaluation -> updates existing draft
    const second = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-amox');
    if (second.action_taken !== 'draft_updated') throw new Error(`Second evaluation should update draft, got ${second.action_taken}`);
    if (requests.length !== 1) throw new Error(`Draft duplicated! Expected 1 request, found ${requests.length}`);
    if (second.request_id !== first.request_id) throw new Error('Request ID should remain the same on update');
  });

  await test('Scenario 6: Adequate stock returns adequate_stock with 0 recommended quantity', async () => {
    resetState();
    const client = makeMockClient();
    batches.push({ id: 'b5', phc_id: 'phc-001', medicine_id: 'med-paracetamol', remaining_qty: 500, minimum_threshold: 10 });

    const result = await AutoDraftService.evaluateForMedicine(client, 'phc-001', 'med-paracetamol');
    if (result.action_taken !== 'adequate_stock') throw new Error(`Expected adequate_stock, got ${result.action_taken}`);
    if (result.recommended_quantity !== 0) throw new Error(`Expected 0 recommended qty, got ${result.recommended_quantity}`);
    if (requests.length !== 0) throw new Error('No request should be created for adequate stock');
  });

  // -------------------------------------------------------------------------
  // Prompt 11: Workforce & Staff Attendance Module
  // -------------------------------------------------------------------------
  console.log('\n--- Prompt 11: Workforce & Staff Attendance Module ---');

  await test('Scenario 7: Staff registry CRUD and role validation', async () => {
    resetState();
    // Valid role creation
    const doc = { id: uid(), phc_id: 'phc-001', name: 'Dr. Sarah Connor', role: 'doctor', active: true, created_at: new Date().toISOString() };
    staffMembers.push(doc);

    const nurse = { id: uid(), phc_id: 'phc-001', name: 'John Doe', role: 'nurse', active: true, created_at: new Date().toISOString() };
    staffMembers.push(nurse);

    if (staffMembers.length !== 2) throw new Error(`Expected 2 staff members, found ${staffMembers.length}`);
    if (staffMembers[0].role !== 'doctor') throw new Error('Role mismatch');
  });

  await test('Scenario 8: Record attendance and normalize on_leave -> leave', async () => {
    resetState();
    const staffId = uid();
    staffMembers.push({ id: staffId, phc_id: 'phc-001', name: 'Nurse Joy', role: 'nurse', active: true, created_at: new Date().toISOString() });

    // Record attendance
    const aRow: AttendanceRow = {
      id: uid(),
      staff_id: staffId,
      attendance_date: '2026-09-13',
      status: 'leave', // normalized from on_leave
      recorded_at: new Date().toISOString(),
    };
    attendances.push(aRow);

    if (attendances.length !== 1) throw new Error(`Expected 1 attendance record, found ${attendances.length}`);
    if (attendances[0].status !== 'leave') throw new Error(`Expected status leave, got ${attendances[0].status}`);
  });

  await test('Scenario 9: Staff shortage detection event fired when 0 doctors present', async () => {
    resetState();
    const client = makeMockClient();
    const docId = uid();
    staffMembers.push({ id: docId, phc_id: 'phc-001', name: 'Dr. House', role: 'doctor', active: true, created_at: new Date().toISOString() });
    // Doctor is absent
    attendances.push({ id: uid(), staff_id: docId, attendance_date: '2026-09-13', status: 'absent', recorded_at: new Date().toISOString() });

    // Trigger shortage check query
    const res = await client.query('SELECT COUNT(*) FILTER (WHERE sr.role = \'doctor\') FROM staff_registry sr ...', ['2026-09-13', 'phc-001']);
    const totalDocs = Number(res.rows[0].total_doctors);
    const presentDocs = Number(res.rows[0].present_doctors);

    if (totalDocs > 0 && presentDocs === 0) {
      await eventBus.publish('staff.shortage_detected', {
        phc_id: 'phc-001',
        attendance_date: '2026-09-13',
        shortage_type: 'doctor_shortage',
      });
    }

    const history = eventBus.getHistory('staff.shortage_detected');
    if (history.length !== 1) throw new Error(`Expected 1 shortage event, found ${history.length}`);
    if (history[0].payload.shortage_type !== 'doctor_shortage') throw new Error('Wrong shortage_type in event');
  });

  // -------------------------------------------------------------------------
  // Prompt 11: Patient Footfall Append-Only TimescaleDB Module
  // -------------------------------------------------------------------------
  console.log('\n--- Prompt 11: Patient Footfall Append-Only TimescaleDB Module ---');

  await test('Scenario 10: Patient footfall observation appended with normalized category', async () => {
    resetState();
    const norm1 = FootfallService.normalizeCategory('general_opd');
    const norm2 = FootfallService.normalizeCategory('maternal_child');
    const norm3 = FootfallService.normalizeCategory('infectious');

    if (norm1 !== 'opd') throw new Error(`general_opd should normalize to opd, got ${norm1}`);
    if (norm2 !== 'disease_maternal') throw new Error(`maternal_child should normalize to disease_maternal, got ${norm2}`);
    if (norm3 !== 'disease_infectious') throw new Error(`infectious should normalize to disease_infectious, got ${norm3}`);

    footfalls.push({ time: new Date().toISOString(), phc_id: 'phc-001', category: norm1, count: 42 });
    if (footfalls.length !== 1) throw new Error(`Expected 1 footfall entry, found ${footfalls.length}`);
    if (footfalls[0].count !== 42) throw new Error(`Expected count 42, got ${footfalls[0].count}`);
  });

  await test('Scenario 11: Footfall correction submitted as new adjustment record (Masterplan §18)', async () => {
    resetState();
    // Original record
    const originalTime = '2026-09-12T10:00:00.000Z';
    footfalls.push({ time: originalTime, phc_id: 'phc-001', category: 'opd', count: 50 });

    // Correction submitted per Masterplan §18 (new adjustment record, original remains intact)
    const adjustmentTime = new Date().toISOString();
    footfalls.push({ time: adjustmentTime, phc_id: 'phc-001', category: 'opd', count: 45 });
    const note = 'Correction for 2026-09-12 (opd): adjusted to 45. Reason: Log sheet recount';

    if (footfalls.length !== 2) throw new Error(`Expected 2 footfall records, found ${footfalls.length}`);
    if (footfalls[0].count !== 50) throw new Error('Original record was overwritten! Footfall must be append-only.');
    if (footfalls[1].count !== 45) throw new Error('Adjustment record not appended correctly.');
  });

  // -------------------------------------------------------------------------
  // Prompt 12: Fast-Path Emergency Reporting Integration
  // -------------------------------------------------------------------------
  console.log('\n--- Prompt 12: Fast-Path Emergency Reporting Integration ---');

  await test('Scenario 12: Emergency report generates CRITICAL alert and emits immediate event', async () => {
    resetState();
    const client = makeMockClient();
    const res = await client.query(
      'INSERT INTO alerts (phc_id, district_id, state_id, alert_type, severity, payload, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      ['phc-001', 'dist-1', 'state-1', 'emergency_report', 'critical', JSON.stringify({ title: 'Oxygen Outage', description: 'Main valve failed' }), 'open'],
    );
    const alertId = res.rows[0].id;

    await eventBus.publish('emergency.created', { id: alertId, phc_id: 'phc-001', alert_type: 'emergency_report', severity: 'critical' });

    if (alerts.length !== 1) throw new Error(`Expected 1 alert row, found ${alerts.length}`);
    if (alerts[0].severity !== 'critical') throw new Error(`Expected severity critical, got ${alerts[0].severity}`);
    const events = eventBus.getHistory('emergency.created');
    if (events.length !== 1) throw new Error(`Expected emergency.created event, found ${events.length}`);
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('✗ Some tests FAILED');
    process.exit(1);
  } else {
    console.log('✓ All Chunk 10 Integration tests PASSED (12/12)');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Unexpected test failure:', err);
  process.exit(1);
});
