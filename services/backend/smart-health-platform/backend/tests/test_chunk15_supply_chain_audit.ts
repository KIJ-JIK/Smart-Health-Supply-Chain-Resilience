/**
 * test_chunk15_supply_chain_audit.ts
 *
 * Integration Test Suite — Chunk 15: Supply Chain Tracking & Append-Only Audit System
 * (Prompts 19 & 20)
 *
 * Mock Strategy: Patches Pool.prototype.connect() and Pool.prototype.query() BEFORE
 * importing any services, so all pg Pool instances (pool, adminPool) receive mock
 * data.
 */

// ── Step 1: Patch pg Pool BEFORE any service imports ─────────────────────────
import { Pool } from 'pg';
import crypto from 'crypto';

let mockShipments: any[] = [];
let mockAuditLogs: any[] = [];
let lastInsertedShipment: any = null;
let lastInsertedAudit: any = null;

function handleQuery(sql: string, params?: any[]): { rows: any[]; rowCount: number } {
  const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // Transaction control
  if (s === 'begin' || s === 'commit' || s === 'rollback') return { rows: [], rowCount: 0 };
  if (s.includes('set_config') || s.includes('get_config')) return { rows: [{ set_config: '' }], rowCount: 1 };

  // ── supply_chain_shipments ────────────────────────────────────────────────
  if (s.includes('supply_chain_shipments') && s.includes('insert')) {
    const row = {
      id: params?.[0] || `ship-${Date.now()}`,
      transfer_id: params?.[1] || null,
      source_phc_id: params?.[2] || 'phc-001',
      dest_phc_id: params?.[3] || 'phc-002',
      medicine_id: params?.[4] || 'med-001',
      quantity: params?.[5] || 100,
      carrier: params?.[6] || 'State-Health-Logistics',
      tracking_number: params?.[7] || `LOG-${Date.now()}`,
      status: 'approved',
      dispatched_at: null,
      estimated_delivery_at: params?.[8] || new Date(Date.now() + 48 * 3600000).toISOString(),
      delivered_at: null,
      is_delayed: false,
      notes: params?.[9] || null,
      created_at: params?.[10] || new Date().toISOString(),
      updated_at: params?.[11] || new Date().toISOString(),
      source_phc_name: 'PHC North',
      dest_phc_name: 'PHC South',
      medicine_name: 'Amoxicillin 500mg',
    };
    lastInsertedShipment = row;
    mockShipments.unshift(row);
    return { rows: [row], rowCount: 1 };
  }

  if (s.includes('supply_chain_shipments') && s.includes('update')) {
    if (s.includes("status = 'dispatched'")) {
      const dispatchedAt = params?.[0];
      const carrier = params?.[1];
      const id = params?.[2];
      const match = mockShipments.find((x) => x.id === id);
      if (match) {
        match.status = 'dispatched';
        match.dispatched_at = dispatchedAt;
        if (carrier) match.carrier = carrier;
        match.updated_at = new Date().toISOString();
        return { rows: [match], rowCount: 1 };
      }
    } else if (s.includes("status = 'delivered'")) {
      const deliveredAt = params?.[0];
      const isDelayed = params?.[1];
      const id = params?.[2];
      const match = mockShipments.find((x) => x.id === id);
      if (match) {
        match.status = 'delivered';
        match.delivered_at = deliveredAt;
        match.is_delayed = Boolean(isDelayed);
        match.updated_at = new Date().toISOString();
        return { rows: [match], rowCount: 1 };
      }
    } else {
      // Manual updateShipmentStatus query
      const status = params?.[0];
      const carrier = params?.[1];
      const notes = params?.[2];
      const dispatchedAt = params?.[3];
      const deliveredAt = params?.[4];
      const isDelayed = params?.[5];
      const id = params?.[7] || params?.[6] || params?.[0];
      const match = mockShipments.find((x) => x.id === id);
      if (match) {
        if (status) match.status = status;
        if (carrier) match.carrier = carrier;
        if (notes) match.notes = notes;
        if (dispatchedAt) match.dispatched_at = dispatchedAt;
        if (deliveredAt) match.delivered_at = deliveredAt;
        if (isDelayed !== undefined) match.is_delayed = Boolean(isDelayed);
        match.updated_at = new Date().toISOString();
        return { rows: [match], rowCount: 1 };
      }
      const updated = {
        id: id || 'ship-001',
        status: status || 'dispatched',
        carrier: carrier || 'State-Health-Logistics',
        notes,
        dispatched_at: dispatchedAt,
        delivered_at: deliveredAt,
        is_delayed: Boolean(isDelayed),
        updated_at: new Date().toISOString(),
      };
      return { rows: [updated], rowCount: 1 };
    }
  }

  if (s.includes('supply_chain_shipments') && s.includes('select')) {
    if (s.includes('where s.id = $1') || s.includes('where id = $1')) {
      const match = mockShipments.find((x) => x.id === params?.[0]);
      return { rows: match ? [match] : (mockShipments[0] ? [mockShipments[0]] : []), rowCount: 1 };
    }
    return { rows: mockShipments, rowCount: mockShipments.length };
  }

  // ── audit_log ─────────────────────────────────────────────────────────────
  if (s.includes('audit_log') && s.includes('insert')) {
    const row = {
      id: params?.[0] || `audit-${Date.now()}`,
      actor_id: params?.[1] || null,
      actor_role: params?.[2] || null,
      action: params?.[3] || 'UNKNOWN',
      entity_type: params?.[4] || null,
      entity_id: params?.[5] || null,
      before_state: params?.[6] ? JSON.parse(params[6]) : null,
      after_state: params?.[7] ? JSON.parse(params[7]) : null,
      phc_id: params?.[8] || null,
      district_id: params?.[9] || null,
      state_id: params?.[10] || null,
      source_ip: params?.[11] || null,
      device_id: params?.[12] || null,
      correlation_id: params?.[13] || null,
      ai_rec_payload: params?.[14] ? JSON.parse(params[14]) : null,
      previous_hash: params?.[15] || '0'.repeat(64),
      this_hash: params?.[16] || '',
      created_at: params?.[17] || new Date().toISOString(),
    };
    lastInsertedAudit = row;
    mockAuditLogs.push(row);
    return { rows: [row], rowCount: 1 };
  }

  if (s.includes('audit_log') && s.includes('select')) {
    if (s.includes('order by created_at desc limit 1')) {
      const latest = mockAuditLogs[mockAuditLogs.length - 1];
      return { rows: latest ? [latest] : [], rowCount: latest ? 1 : 0 };
    }
    if (s.includes('order by created_at asc')) {
      return { rows: [...mockAuditLogs], rowCount: mockAuditLogs.length };
    }
    return { rows: mockAuditLogs, rowCount: mockAuditLogs.length };
  }

  // Fallback
  return { rows: [], rowCount: 0 };
}

(Pool.prototype as any).query = function (sql: any, params?: any) {
  if (typeof sql === 'string') return Promise.resolve(handleQuery(sql, params));
  return Promise.resolve({ rows: [], rowCount: 0 });
};

(Pool.prototype as any).connect = function () {
  return Promise.resolve({
    query: (sql: any, params?: any) => {
      if (typeof sql === 'string') return Promise.resolve(handleQuery(sql, params));
      return Promise.resolve({ rows: [], rowCount: 0 });
    },
    release: () => {},
  });
};

// ── Step 2: Import services after mock interception ──────────────────────────
import { SupplyChainService } from '../src/modules/supplychain/supplyChainService';
import { AuditService, GENESIS_AUDIT_HASH } from '../src/modules/audit/auditService';
import { GovernanceService } from '../src/modules/governance/governanceService';
import { eventBus } from '../src/events/eventBus';
import { TenantClaims } from '../src/db/pool';

// ── Test Runner ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

const nationalClaims: TenantClaims = {
  sub: 'user-nat-001',
  role: 'national_admin',
};

const districtClaims: TenantClaims = {
  sub: 'user-dist-001',
  role: 'district_admin',
  districtId: 'dist-001',
  stateId: 'state-001',
};

const phcClaims: TenantClaims = {
  sub: 'user-phc-001',
  role: 'phc_user',
  phcId: 'phc-001',
  districtId: 'dist-001',
  stateId: 'state-001',
};

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 15 Integration Test Suite: Supply Chain & Append-Only Audit');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Initialize event listeners for supply chain automation
  SupplyChainService.initEventSubscribers();

  // ── 1. Event Automation: redistribution.approved -> shipment creation ──────
  console.log('▶ 1. redistribution.approved automatically spawns supply chain shipment');
  {
    await eventBus.publish('redistribution.approved', {
      transfer_id: 'trans-001',
      source_phc_id: 'phc-001',
      dest_phc_id: 'phc-002',
      medicine_id: 'med-paracetamol',
      quantity: 500,
      approved_by: 'district_admin_01',
    });

    // Allow event listener tick to execute
    await new Promise((r) => setTimeout(r, 50));

    assert('shipment record created', lastInsertedShipment !== null);
    assert('transfer_id matches transfer', lastInsertedShipment?.transfer_id === 'trans-001');
    assert('source_phc_id matches', lastInsertedShipment?.source_phc_id === 'phc-001');
    assert('dest_phc_id matches', lastInsertedShipment?.dest_phc_id === 'phc-002');
    assert('quantity matches', lastInsertedShipment?.quantity === 500);
    assert('tracking number starts with LOG-', lastInsertedShipment?.tracking_number.startsWith('LOG-'));
    assert('initial status is approved', lastInsertedShipment?.status === 'approved');
    assert('estimated_delivery_at set', lastInsertedShipment?.estimated_delivery_at !== null);
  }

  // ── 2. Shipment Lifecycle: shipment.dispatched event ─────────────────────────
  console.log('\n▶ 2. shipment.dispatched sets status and dispatched_at');
  {
    const shipmentId = lastInsertedShipment.id;
    const dispatchTime = new Date().toISOString();

    await eventBus.publish('shipment.dispatched', {
      shipment_id: shipmentId,
      transfer_id: 'trans-001',
      source_phc_id: 'phc-001',
      dest_phc_id: 'phc-002',
      dispatched_at: dispatchTime,
      carrier: 'FastHealth-Express',
    });

    await new Promise((r) => setTimeout(r, 50));

    const s = mockShipments.find((x) => x.id === shipmentId);
    assert('shipment status updated to dispatched', s?.status === 'dispatched');
    assert('dispatched_at populated', s?.dispatched_at === dispatchTime);
    assert('carrier updated', s?.carrier === 'FastHealth-Express');
  }

  // ── 3. Manual Status Transition Endpoint ───────────────────────────────────
  console.log('\n▶ 3. SupplyChainService.updateShipmentStatus transitions shipment');
  {
    const shipmentId = lastInsertedShipment.id;

    // phc_user cannot manually update logistics statuses
    let forbiddenCaught = false;
    try {
      await SupplyChainService.updateShipmentStatus(phcClaims, shipmentId, {
        status: 'in_transit',
      });
    } catch (e: any) {
      forbiddenCaught = e.statusCode === 403;
    }
    assert('phc_user rejected with 403 Forbidden', forbiddenCaught);

    // district_admin can update status
    const updated = await SupplyChainService.updateShipmentStatus(districtClaims, shipmentId, {
      status: 'in_transit',
      notes: 'Driver picked up consignment from facility dock',
    });

    assert('district_admin successfully updated status', updated.status === 'in_transit');
    assert('notes field recorded', updated.notes === 'Driver picked up consignment from facility dock');
  }

  // ── 4. Delay Detection & Delivery Lifecycle ──────────────────────────────────
  console.log('\n▶ 4. Delay detection correctly identifies overdue deliveries');
  {
    const shipmentId = lastInsertedShipment.id;
    // Set estimated delivery to 2 hours ago
    const pastEta = new Date(Date.now() - 2 * 3600000).toISOString();
    const actualDelivery = new Date().toISOString();
    mockShipments.find((x) => x.id === shipmentId).estimated_delivery_at = pastEta;

    const delivered = await SupplyChainService.updateShipmentStatus(districtClaims, shipmentId, {
      status: 'delivered',
      deliveredAt: actualDelivery,
    });

    assert('status transitioned to delivered', delivered.status === 'delivered');
    assert('deliveredAt is populated', delivered.deliveredAt === actualDelivery);
    assert('isDelayed calculated as true (delivered > estimated)', delivered.isDelayed === true);
  }

  // ── 5. Supplier & Delay Analytics ──────────────────────────────────────────
  console.log('\n▶ 5. SupplyChainService.getSupplierAnalytics computes performance KPIs');
  {
    // Add a second non-delayed on-time shipment for analytics calculation
    mockShipments.push({
      id: 'ship-ontime-002',
      transfer_id: 'trans-002',
      source_phc_id: 'phc-001',
      dest_phc_id: 'phc-003',
      medicine_id: 'med-002',
      quantity: 200,
      carrier: 'FastHealth-Express',
      tracking_number: 'LOG-ONTIME99',
      status: 'delivered',
      dispatched_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      estimated_delivery_at: new Date(Date.now() + 24 * 3600000).toISOString(),
      delivered_at: new Date().toISOString(),
      is_delayed: false,
      notes: 'Delivered ahead of schedule',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const analytics = await SupplyChainService.getSupplierAnalytics(nationalClaims);
    assert('analytics object returned', analytics !== null);
    assert('totalShipments is at least 2', analytics.totalShipments >= 2);
    assert('deliveredCount is recorded', analytics.deliveredCount >= 2);
    assert('delayedCount is recorded', analytics.delayedCount >= 1);
    assert('onTimeDeliveryRate is number in [0, 100]', typeof analytics.onTimeDeliveryRate === 'number' && analytics.onTimeDeliveryRate >= 0 && analytics.onTimeDeliveryRate <= 100);
    assert('averageTransitHours is number', typeof analytics.averageTransitHours === 'number' && analytics.averageTransitHours >= 0);
    assert('carrierPerformance array present', Array.isArray(analytics.carrierPerformance) && analytics.carrierPerformance.length > 0);
  }

  // ── 6. Supply Chain Query Scoping ──────────────────────────────────────────
  console.log('\n▶ 6. SupplyChainService.listShipments returns mapped shipment items');
  {
    const shipments = await SupplyChainService.listShipments(nationalClaims, { limit: 10 });
    assert('shipments list is array', Array.isArray(shipments));
    assert('contains at least 2 shipments', shipments.length >= 2);
    assert('first shipment has trackingNumber', typeof shipments[0].trackingNumber === 'string');
    assert('first shipment has status', typeof shipments[0].status === 'string');
    assert('first shipment has quantity', typeof shipments[0].quantity === 'number');
  }

  // ── 7. Audit System: Genesis Hash & Append-Only Write ──────────────────────
  console.log('\n▶ 7. AuditService enforces genesis hash and append-only entry creation');
  {
    assert('GENESIS_AUDIT_HASH is 64 zeroes', GENESIS_AUDIT_HASH === '0'.repeat(64));

    const entry1 = await AuditService.recordAuditEntry({
      actorId: 'user-001',
      actorRole: 'district_admin',
      action: 'RESOURCE_REQUEST_APPROVE',
      entityType: 'resource_requests',
      entityId: 'req-101',
      beforeState: { status: 'submitted' },
      afterState: { status: 'approved' },
      phcId: 'phc-001',
      districtId: 'dist-001',
      stateId: 'state-001',
    });

    assert('first audit record created', entry1 !== null);
    assert('entry1 previousHash equals GENESIS_HASH', entry1.previousHash === GENESIS_AUDIT_HASH);
    assert('entry1 thisHash is 64-character hex SHA-256', entry1.thisHash.length === 64 && /^[0-9a-f]{64}$/.test(entry1.thisHash));
    assert('action matches', entry1.action === 'RESOURCE_REQUEST_APPROVE');
    assert('entityType matches', entry1.entityType === 'resource_requests');
  }

  // ── 8. Cryptographic Hash-Chaining ─────────────────────────────────────────
  console.log('\n▶ 8. AuditService computes unbroken cryptographic hash-chain');
  {
    const firstHash = lastInsertedAudit.this_hash;

    const entry2 = await AuditService.recordAuditEntry({
      actorId: 'user-002',
      actorRole: 'phc_user',
      action: 'BILLING_TRANSACTION_CREATE',
      entityType: 'billing_transactions',
      entityId: 'txn-202',
      beforeState: null,
      afterState: { totalAmount: 150.0 },
      phcId: 'phc-001',
    });

    assert('entry2 previousHash links to entry1 thisHash', entry2.previousHash === firstHash);
    assert('entry2 thisHash is distinct unique hash', entry2.thisHash !== entry2.previousHash);
    assert('entry2 thisHash is valid SHA-256', entry2.thisHash.length === 64);

    // Verify hash chain
    const verification = await AuditService.verifyAuditChain();
    assert('audit chain verification succeeds (isValid = true)', verification.isValid === true);
    assert('checked at least 2 records', verification.recordsChecked >= 2);
  }

  // ── 9. Cross-Tenant Read Detection ─────────────────────────────────────────
  console.log('\n▶ 9. AuditService.recordCrossTenantRead captures jurisdiction boundary cross');
  {
    const crossRead = await AuditService.recordCrossTenantRead(
      districtClaims,
      'phc_facilities',
      'phc-other-district-999',
      { phcId: 'phc-other-district-999', districtId: 'dist-other-999' },
      { sourceIp: '192.168.1.50', correlationId: 'corr-cross-99' },
    );

    assert('cross-tenant read entry recorded', crossRead !== null);
    assert('action is CROSS_TENANT_READ', crossRead.action === 'CROSS_TENANT_READ');
    assert('actorRole is district_admin', crossRead.actorRole === 'district_admin');
    assert('sourceIp captured', crossRead.sourceIp === '192.168.1.50');
    assert('correlationId captured', crossRead.correlationId === 'corr-cross-99');
    assert('afterState contains targetTenant', crossRead.afterState?.targetTenant?.phcId === 'phc-other-district-999');
  }

  // ── 10. AI Recommendation Payload Attachment ───────────────────────────────
  console.log('\n▶ 10. AuditService attaches AI recommendation payload to decision entries');
  {
    const aiRec = {
      model: 'OR-Tools-MILP-Optimizer',
      version: 'v1.4',
      optimizationScore: 0.94,
      recommendedQuantity: 300,
      confidenceScore: 0.91,
    };

    const auditAi = await AuditService.recordAuditEntry({
      actorId: 'user-001',
      actorRole: 'district_admin',
      action: 'REDISTRIBUTION_TRANSFER_DECIDE',
      entityType: 'redistribution_transfers',
      entityId: 'transfer-ai-001',
      beforeState: { status: 'recommended' },
      afterState: { status: 'approved' },
      aiRecPayload: aiRec,
    });

    assert('AI recommendation payload recorded', auditAi.aiRecPayload !== null);
    assert('model matches OR-Tools-MILP-Optimizer', auditAi.aiRecPayload.model === 'OR-Tools-MILP-Optimizer');
    assert('optimizationScore preserved', auditAi.aiRecPayload.optimizationScore === 0.94);
  }

  // ── 11. Scoped Audit Log Queries ───────────────────────────────────────────
  console.log('\n▶ 11. AuditService.queryAuditLogs filters by caller jurisdiction');
  {
    const logs = await AuditService.queryAuditLogs(nationalClaims, { limit: 10 });
    assert('queryAuditLogs returns array', Array.isArray(logs));
    assert('returns all recorded logs for national_admin', logs.length >= 4);

    const summary = await AuditService.getAuditSummary(nationalClaims);
    assert('summary object returned', summary !== null);
    assert('totalRecords is positive', summary.totalRecords >= 4);
    assert('crossTenantReadsCount is at least 1', summary.crossTenantReadsCount >= 1);
    assert('chainIntegrityValid is true', summary.chainIntegrityValid === true);
  }

  // ── 12. Governance Integration: GraphQL Resolvers Delegation ───────────────
  console.log('\n▶ 12. GovernanceService delegates supplyChainShipments and auditLog queries');
  {
    const shipments = await GovernanceService.getSupplyChainShipments(nationalClaims);
    assert('getSupplyChainShipments returns array', Array.isArray(shipments));
    assert('shipments have GraphQL schema fields', shipments.length > 0 && typeof shipments[0].sourcePhcName === 'string');
    assert('shipments have trackingNumber', typeof shipments[0].trackingNumber === 'string');

    const auditLogs = await GovernanceService.getAuditLog(nationalClaims);
    assert('getAuditLog returns array', Array.isArray(auditLogs));
    assert('audit logs have GraphQL schema fields', auditLogs.length > 0 && typeof auditLogs[0].action === 'string');
    assert('audit logs have actorRole', typeof auditLogs[0].actorRole === 'string');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`Chunk 15 Tests: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('All Chunk 15 tests passed ✅\n');
  } else {
    console.error('Some Chunk 15 tests failed ❌\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test suite exception:', err);
  process.exit(1);
});
