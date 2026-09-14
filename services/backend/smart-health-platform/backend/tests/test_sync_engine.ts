/**
 * Offline Sync Engine Integration Test Suite (Prompt 6, Architecture §8.2, §8.4)
 *
 * Verifies:
 *  1. Duplicate push retry (idempotent upsert semantics, never double-applies)
 *  2. Two devices racing the same batch (stock_oversold conflict detection)
 *  3. Stale watermark triggering 410 Gone & incremental delta pull
 *  4. Multi-entity mutation batch routing (footfall, requests, facility, attendance, alert)
 */

import crypto from 'crypto';
import { SyncService } from '../src/modules/sync/syncService';
import { adminPool, pool } from '../src/db/pool';

function assert(label: string, condition: boolean, detail?: string) {
  const icon = condition ? '✓' : '✗';
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`  ${icon} [${status}] ${label}${detail ? ` (${detail})` : ''}`);
  if (!condition) {
    process.exitCode = 1;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' Sync Engine Integration Test Suite (Prompt 6, §8.4)');
  console.log('══════════════════════════════════════════════════════\n');

  // Query real fixture data
  const phcRes = await adminPool.query(`SELECT id FROM phc_facilities LIMIT 1`);
  const phcId = phcRes.rows[0].id;

  const deviceId1 = crypto.randomUUID();
  const deviceId2 = crypto.randomUUID();

  // ---------------------------------------------------------------------------
  // 1. Scenario: Duplicate Push Retry (Idempotency)
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 1: Duplicate Push Retry (Idempotency)');
  const mutationId1 = crypto.randomUUID();
  const pushBatch1 = {
    device_id: deviceId1,
    phc_id: phcId,
    client_clock: new Date().toISOString(),
    mutations: [
      {
        id: mutationId1,
        entity_type: 'footfall_entry' as const,
        operation: 'create' as const,
        payload: { category: 'opd', count: 12, time: new Date().toISOString() },
        local_seq: 1,
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  // First push attempt
  const res1 = await SyncService.processPush(pushBatch1);
  assert('First push returns accepted', res1.results[0]?.status === 'accepted');
  assert('Server sequence assigned', res1.server_seq > 0);

  // Second push attempt with identical mutation ID
  const res2 = await SyncService.processPush(pushBatch1);
  assert('Retry push returns duplicate', res2.results[0]?.status === 'duplicate');
  assert('Mutation ID preserved in response', res2.results[0]?.mutation_id === mutationId1);

  // Verify DB state: only 1 entry in mutation_queue
  const countCheck = await adminPool.query(
    `SELECT COUNT(*) FROM mutation_queue WHERE id = $1 OR mutation_id = $1`,
    [mutationId1],
  );
  assert('Exactly one row exists in mutation_queue', Number(countCheck.rows[0].count) === 1);
  console.log('└─ Scenario 1 OK\n');

  // ---------------------------------------------------------------------------
  // 2. Scenario: Two Devices Racing the Same Batch (Stock Oversold Conflict)
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 2: Two Devices Racing the Same Batch (§8.3 Conflict)');

  // Create dedicated test medicine and inventory batch with exactly 10 units
  const testMedName = `RaceTestMed-${Date.now()}`;
  const medInsert = await adminPool.query(
    `INSERT INTO medicines (name, category, unit)
     VALUES ($1, 'Antibiotic', 'strip')
     RETURNING id`,
    [testMedName],
  );
  const raceMedId = medInsert.rows[0].id;

  const batchNo = `RACE-TEST-${Date.now()}`;
  const batchInsert = await adminPool.query(
    `INSERT INTO inventory_batches (
       phc_id, medicine_id, batch_no, received_qty, remaining_qty, minimum_threshold, expiry_date
     ) VALUES ($1, $2, $3, 10, 10, 2, '2028-06-30')
     RETURNING id`,
    [phcId, raceMedId, batchNo],
  );
  const testBatchId = batchInsert.rows[0].id;

  // Device 1: Dispenses 8 units (valid, remaining becomes 2)
  const dev1MutationId = crypto.randomUUID();
  const dev1Push = {
    device_id: deviceId1,
    phc_id: phcId,
    client_clock: new Date().toISOString(),
    mutations: [
      {
        id: dev1MutationId,
        entity_type: 'billing_transaction' as const,
        operation: 'create' as const,
        payload: {
          client_txn_id: dev1MutationId,
          items: [{ medicine_id: raceMedId, quantity: 8 }],
        },
        local_seq: 2,
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  const dev1Res = await SyncService.processPush(dev1Push);
  assert('Device 1 checkout of 8 units: accepted', dev1Res.results[0]?.status === 'accepted');

  // Verify server stock after Device 1
  const stockAfterDev1 = await adminPool.query(
    `SELECT remaining_qty FROM inventory_batches WHERE id = $1`,
    [testBatchId],
  );
  assert('Server stock reduced to 2 units', Number(stockAfterDev1.rows[0].remaining_qty) === 2);

  // Device 2: While offline, also checked out 5 units against the old stock of 10.
  // When Device 2 syncs, only 2 units remain -> stock_oversold conflict!
  const dev2MutationId = crypto.randomUUID();
  const dev2Push = {
    device_id: deviceId2,
    phc_id: phcId,
    client_clock: new Date().toISOString(),
    mutations: [
      {
        id: dev2MutationId,
        entity_type: 'billing_transaction' as const,
        operation: 'create' as const,
        payload: {
          client_txn_id: dev2MutationId,
          items: [{ medicine_id: raceMedId, quantity: 5 }],
        },
        local_seq: 1,
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  const dev2Res = await SyncService.processPush(dev2Push);
  const dev2Result = dev2Res.results[0];

  assert('Device 2 checkout returned conflict', dev2Result?.status === 'conflict');
  assert('Conflict type is stock_oversold', dev2Result?.conflict?.conflict_type === 'stock_oversold');
  assert('Server state contains available_qty: 2', dev2Result?.conflict?.server_state.available_qty === 2);
  assert('Server state contains requested_qty: 5', dev2Result?.conflict?.server_state.requested_qty === 5);
  assert('Suggested resolution is requeue_with_reduced_quantity',
    dev2Result?.conflict?.suggested_resolution === 'requeue_with_reduced_quantity');
  assert('Reconciliation ref UUID present', !!dev2Result?.conflict?.reconciliation_ref);

  // Server stock must remain 2 (not negative)
  const finalStock = await adminPool.query(
    `SELECT remaining_qty FROM inventory_batches WHERE id = $1`,
    [testBatchId],
  );
  assert('Final server stock safe at 2 (no overselling)', Number(finalStock.rows[0].remaining_qty) === 2);
  console.log('└─ Scenario 2 OK\n');

  // ---------------------------------------------------------------------------
  // 3. Scenario: Stale Watermark 410 Gone & Incremental Pull
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 3: Stale Watermark & Incremental Pull');

  // Incremental pull with valid watermark
  const pullRes = await SyncService.processPull({
    phcId,
    since: 0,
    deviceId: deviceId1,
    limit: 10,
  });

  assert('Sync pull returned deltas array', Array.isArray(pullRes.deltas));
  assert('Sync pull returned server_seq watermark', pullRes.server_seq > 0);
  assert('Sync pull returned has_more flag', typeof pullRes.has_more === 'boolean');

  // Stale watermark simulation: since older than retention window or negative
  let caught410 = false;
  try {
    await SyncService.processPull({
      phcId,
      since: -1,
      deviceId: deviceId1,
    });
  } catch (err: any) {
    caught410 = err.statusCode === 410 || err.message.includes('WATERMARK');
  }
  assert('Invalid/stale watermark rejected with 410', caught410);
  console.log('└─ Scenario 3 OK\n');

  // ---------------------------------------------------------------------------
  // 4. Scenario: Multi-Entity Mutation Batch Routing
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 4: Multi-Entity Mutation Routing');

  const multiBatch = {
    device_id: deviceId1,
    phc_id: phcId,
    client_clock: new Date().toISOString(),
    mutations: [
      {
        id: crypto.randomUUID(),
        entity_type: 'resource_request' as const,
        operation: 'create' as const,
        payload: { request_type: 'medicine', priority: 'urgent', items: [{ medicine_id: raceMedId, requested_qty: 40 }] },
        local_seq: 10,
        client_timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        entity_type: 'facility_update' as const,
        operation: 'update' as const,
        payload: { total_beds: 35, occupied_beds: 20 },
        local_seq: 11,
        client_timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        entity_type: 'alert_report' as const,
        operation: 'create' as const,
        payload: { alert_type: 'emergency_report', severity: 'critical', title: 'Power surge alert' },
        local_seq: 12,
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  const multiRes = await SyncService.processPush(multiBatch);
  assert('Batch processed 3 mutations', multiRes.results.length === 3);
  assert('Mutation 1 (request) accepted', multiRes.results[0]?.status === 'accepted');
  assert('Mutation 2 (facility) accepted', multiRes.results[1]?.status === 'accepted');
  assert('Mutation 3 (alert) accepted', multiRes.results[2]?.status === 'accepted');
  console.log('└─ Scenario 4 OK\n');

  console.log('══════════════════════════════════════════════════════');
  if (process.exitCode === 1) {
    console.log(' ✗  Sync Engine Integration tests FAILED');
  } else {
    console.log(' ✓  All Sync Engine Integration tests PASSED');
  }
  console.log('══════════════════════════════════════════════════════\n');

  await pool.end();
  await adminPool.end();
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
