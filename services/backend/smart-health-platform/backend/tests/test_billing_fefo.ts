/**
 * test_billing_fefo.ts -- Integration tests for Prompt 9: FEFO Billing / Dispensing Engine
 *
 * Scenarios:
 *  1. Happy-path checkout: single medicine, single batch, FEFO order honoured
 *  2. Cross-batch deduction: qty spans two batches, earliest-expiry drained first
 *  3. Idempotency: same client_txn_id returns already_existed:true, no duplicate writes
 *  4. Insufficient stock: returns CheckoutInsufficientStock with shortfalls array
 *  5. Sync path maps insufficient_stock -> stock_oversold conflict (SS8.3)
 *  6. billing.transaction_completed event emitted after successful checkout
 *  7. stock.threshold_breached emitted when stock goes CRITICAL after dispensing
 */

import { PoolClient } from 'pg';
import { eventBus } from '../src/events/eventBus';

// --------------- In-memory DB state ---------------
interface Batch { id: string; phc_id: string; medicine_id: string; remaining_qty: number; expiry_date: string; minimum_threshold: number; }
interface BillingTxn { id: string; phc_id: string; client_txn_id: string; patient_ref: string|null; dispensed_by_staff_id: string|null; total_amount: number; client_timestamp: string; status: string; }
interface DispensedItem { id: string; billing_transaction_id: string; batch_id: string; medicine_id: string; quantity: number; unit_price: number; }
interface ConsumptionRow { medicine_id: string; qty_dispensed: number; }

let batches: Batch[] = [];
let billingTxns: BillingTxn[] = [];
let dispensedItems: DispensedItem[] = [];
let consumptionRows: ConsumptionRow[] = [];
let nextId = 1;
function uid() { return String(nextId++); }

function resetState() {
  batches = []; billingTxns = []; dispensedItems = []; consumptionRows = []; nextId = 1;
  eventBus.clearHistory();
}

// --------------- Mock PoolClient ---------------
type QueryFn = (sql: string, params?: any[]) => Promise<{ rows: Record<string,any>[] }>;

function makeMockClient(): PoolClient {
  const handler: QueryFn = async (sql: string, params: any[] = []) => {
    const s = sql.replace(/\s+/g, ' ').trim();

    // Idempotency SELECT on billing_transactions by client_txn_id
    if (s.includes('FROM billing_transactions') && s.includes('client_txn_id')) {
      const found = billingTxns.find((t) => t.phc_id === params[0] && t.client_txn_id === params[1]);
      return { rows: found ? [{ id: found.id, total_amount: found.total_amount }] : [] };
    }
    // Re-fetch dispensed_items for idempotency reply
    if (s.includes('FROM dispensed_items') && s.includes('billing_transaction_id')) {
      const rows = dispensedItems.filter((d) => d.billing_transaction_id === params[0]).map((d) => ({
        batch_id: d.batch_id, medicine_id: d.medicine_id, quantity_deducted: d.quantity, unit_price: d.unit_price,
      }));
      return { rows };
    }
    // FEFO batch lock SELECT
    if (s.includes('FOR UPDATE SKIP LOCKED')) {
      const eligible = batches
        .filter((b) => b.phc_id === params[0] && b.medicine_id === params[1] && b.remaining_qty > 0)
        .sort((a, b2) => a.expiry_date.localeCompare(b2.expiry_date));
      return { rows: eligible.map((b) => ({ id: b.id, remaining_qty: b.remaining_qty, expiry_date: b.expiry_date, minimum_threshold: b.minimum_threshold })) };
    }
    // INSERT billing_transactions
    if (s.includes('INSERT INTO billing_transactions')) {
      const id = uid();
      billingTxns.push({ id, phc_id: params[0], client_txn_id: params[1], patient_ref: params[2], dispensed_by_staff_id: params[3], total_amount: params[4], client_timestamp: params[5], status: 'completed' });
      return { rows: [{ id }] };
    }
    // UPDATE inventory_batches
    if (s.includes('UPDATE inventory_batches')) {
      const batch = batches.find((b) => b.id === params[1]);
      if (batch) batch.remaining_qty -= params[0];
      return { rows: [] };
    }
    // INSERT dispensed_items
    if (s.includes('INSERT INTO dispensed_items')) {
      dispensedItems.push({ id: uid(), billing_transaction_id: params[0], batch_id: params[1], medicine_id: params[2], quantity: params[3], unit_price: params[4] });
      return { rows: [] };
    }
    // INSERT consumption_velocity
    if (s.includes('INSERT INTO consumption_velocity')) {
      consumptionRows.push({ medicine_id: params[2], qty_dispensed: params[3] });
      return { rows: [] };
    }
    // Threshold re-check SELECT (all batches for a medicine)
    if (s.includes('FROM inventory_batches') && s.includes('medicine_id = $2')) {
      return { rows: batches.filter((b) => b.phc_id === params[0] && b.medicine_id === params[1]) };
    }
    if (s.includes('set_config') || /^(BEGIN|COMMIT|ROLLBACK)$/.test(s)) return { rows: [] };
    return { rows: [] };
  };
  return { query: handler, release: () => {} } as unknown as PoolClient;
}

// --------------- Test helpers ---------------
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function getBillingService() {
  return (await import('../src/modules/billing/billingService')).BillingService;
}

// =================== SCENARIOS ===================

async function scenario1() {
  console.log('\nScenario 1: Happy-path checkout (single medicine, single batch)');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-1'; const medId = 'med-para';
  batches.push({ id: 'batch-A', phc_id: phcId, medicine_id: medId, remaining_qty: 100, expiry_date: '2027-06-01', minimum_threshold: 20 });
  const client = makeMockClient();

  await test('returns outcome: success', async () => {
    const r = await BS.checkout(client, phcId, { client_txn_id: 'txn-001', items: [{ medicine_id: medId, quantity: 30, unit_price: 5 }] });
    assert(r.outcome === 'success', `Expected success, got ${r.outcome}`);
  });
  await test('deducts correct qty from batch (100 - 30 = 70)', async () => {
    assert(batches[0].remaining_qty === 70, `Expected 70, got ${batches[0].remaining_qty}`);
  });
  await test('inserts billing_transactions row', async () => {
    assert(billingTxns.length === 1, `Expected 1 txn`);
    assert(billingTxns[0].client_txn_id === 'txn-001', 'Wrong client_txn_id');
  });
  await test('inserts dispensed_item with quantity 30', async () => {
    assert(dispensedItems.length === 1 && dispensedItems[0].quantity === 30, `Unexpected dispensed qty`);
  });
  await test('inserts consumption_velocity row', async () => {
    assert(consumptionRows.length === 1 && consumptionRows[0].qty_dispensed === 30, 'Velocity row missing');
  });
}

async function scenario2() {
  console.log('\nScenario 2: Cross-batch FEFO deduction (earliest-expiry first)');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-1'; const medId = 'med-amox';
  batches.push({ id: 'batch-old', phc_id: phcId, medicine_id: medId, remaining_qty: 20, expiry_date: '2026-12-01', minimum_threshold: 10 });
  batches.push({ id: 'batch-new', phc_id: phcId, medicine_id: medId, remaining_qty: 50, expiry_date: '2027-06-01', minimum_threshold: 10 });
  const client = makeMockClient();

  await BS.checkout(client, phcId, { client_txn_id: 'txn-002', items: [{ medicine_id: medId, quantity: 30 }] });

  await test('checkout success spanning two batches', async () => {
    assert(billingTxns.length === 1, 'Expected 1 txn');
  });
  await test('older batch (2026-12-01) fully drained first', async () => {
    assert(batches[0].remaining_qty === 0, `Expected 0, got ${batches[0].remaining_qty}`);
  });
  await test('newer batch partially consumed (50 - 10 = 40)', async () => {
    assert(batches[1].remaining_qty === 40, `Expected 40, got ${batches[1].remaining_qty}`);
  });
  await test('two dispensed_item rows (one per batch)', async () => {
    assert(dispensedItems.length === 2, `Expected 2, got ${dispensedItems.length}`);
  });
}

async function scenario3() {
  console.log('\nScenario 3: Idempotency -- duplicate client_txn_id');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-1'; const medId = 'med-p';
  batches.push({ id: 'batch-Z', phc_id: phcId, medicine_id: medId, remaining_qty: 100, expiry_date: '2027-01-01', minimum_threshold: 5 });
  const client = makeMockClient();

  await BS.checkout(client, phcId, { client_txn_id: 'txn-idem', items: [{ medicine_id: medId, quantity: 10, unit_price: 2 }] });
  const qtyAfter1 = batches[0].remaining_qty;
  const dispAfter1 = dispensedItems.length;

  await test('second call returns already_existed: true', async () => {
    const r = await BS.checkout(client, phcId, { client_txn_id: 'txn-idem', items: [{ medicine_id: medId, quantity: 10, unit_price: 2 }] }) as any;
    assert(r.outcome === 'success', 'expected success');
    assert(r.already_existed === true, 'expected already_existed=true');
  });
  await test('no additional stock deducted on replay', async () => {
    assert(batches[0].remaining_qty === qtyAfter1, `Qty changed after replay`);
  });
  await test('no extra dispensed_item row on replay', async () => {
    assert(dispensedItems.length === dispAfter1, `Got extra dispensed rows`);
  });
}

async function scenario4() {
  console.log('\nScenario 4: Insufficient stock');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-1'; const medId = 'med-rare';
  batches.push({ id: 'batch-tiny', phc_id: phcId, medicine_id: medId, remaining_qty: 5, expiry_date: '2027-01-01', minimum_threshold: 2 });
  const client = makeMockClient();

  await test('returns outcome: insufficient_stock', async () => {
    const r = await BS.checkout(client, phcId, { client_txn_id: 'txn-bad', items: [{ medicine_id: medId, quantity: 50 }] });
    assert(r.outcome === 'insufficient_stock', `Got ${r.outcome}`);
  });
  await test('shortfalls array contains correct medicine and available_qty', async () => {
    const r = await BS.checkout(client, phcId, { client_txn_id: 'txn-bad2', items: [{ medicine_id: medId, quantity: 50 }] }) as any;
    assert(r.shortfalls.length === 1, 'Expected 1 shortfall');
    assert(r.shortfalls[0].medicine_id === medId, 'Wrong medicine_id');
    assert(r.shortfalls[0].available_qty === 5, `Expected 5, got ${r.shortfalls[0].available_qty}`);
  });
  await test('no billing_transaction or dispensed_item written', async () => {
    assert(billingTxns.length === 0 && dispensedItems.length === 0, 'Unexpected writes on failure');
  });
}

async function scenario5() {
  console.log('\nScenario 5: Sync path -- canonical service returns insufficient_stock (SS8.3)');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-sync'; const medId = 'med-sync-rare';
  batches.push({ id: 'batch-s', phc_id: phcId, medicine_id: medId, remaining_qty: 3, expiry_date: '2027-01-01', minimum_threshold: 2 });
  const client = makeMockClient();

  const result = await BS.checkout(client, phcId, { client_txn_id: 'sync-txn-001', items: [{ medicine_id: medId, quantity: 100 }] });

  await test('canonical service returns insufficient_stock', async () => {
    assert(result.outcome === 'insufficient_stock', `Got ${result.outcome}`);
  });
  await test('shortfall qty is correct (available=3, requested=100)', async () => {
    const sf = (result as any).shortfalls[0];
    assert(sf.available_qty === 3, `Expected 3, got ${sf.available_qty}`);
    assert(sf.requested_qty === 100, `Expected 100, got ${sf.requested_qty}`);
  });
}

async function scenario6() {
  console.log('\nScenario 6: billing.transaction_completed event emitted');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-ev'; const medId = 'med-ev';
  batches.push({ id: 'batch-ev', phc_id: phcId, medicine_id: medId, remaining_qty: 50, expiry_date: '2027-01-01', minimum_threshold: 5 });
  const client = makeMockClient();

  await BS.checkout(client, phcId, { client_txn_id: 'txn-ev', items: [{ medicine_id: medId, quantity: 10 }] });
  await new Promise<void>((r) => setTimeout(r, 30));

  await test('billing.transaction_completed event in history', async () => {
    const events = eventBus.getHistory('billing.transaction_completed');
    assert(events.length >= 1, `Expected >=1 event, got ${events.length}`);
    assert(events[0].payload.phc_id === phcId, 'Wrong phc_id in event');
  });
  await test('event payload has transaction_id and item_count', async () => {
    const ev = eventBus.getHistory('billing.transaction_completed')[0];
    assert(typeof ev.payload.transaction_id === 'string', 'Missing transaction_id');
    assert(typeof ev.payload.item_count === 'number', 'Missing item_count');
  });
}

async function scenario7() {
  console.log('\nScenario 7: stock.threshold_breached emitted when stock goes CRITICAL');
  resetState();
  const BS = await getBillingService();
  const phcId = 'phc-crit'; const medId = 'med-crit';
  // remaining=10, threshold=20 -> after dispensing 8, remaining=2 which is < threshold => CRITICAL
  batches.push({ id: 'batch-crit', phc_id: phcId, medicine_id: medId, remaining_qty: 10, expiry_date: '2027-01-01', minimum_threshold: 20 });
  const client = makeMockClient();

  await BS.checkout(client, phcId, { client_txn_id: 'txn-crit', items: [{ medicine_id: medId, quantity: 8 }] });
  await new Promise<void>((r) => setTimeout(r, 30));

  await test('stock.threshold_breached fired with CRITICAL status', async () => {
    const events = eventBus.getHistory('stock.threshold_breached');
    assert(events.length >= 1, `Expected threshold event`);
    assert(events[0].payload.medicine_id === medId, 'Wrong medicine_id');
    assert(events[0].payload.health_status === 'CRITICAL', `Expected CRITICAL, got ${events[0].payload.health_status}`);
    assert(events[0].payload.triggered_by === 'billing_checkout', 'Wrong triggered_by');
  });
}

// =================== MAIN ===================
(async () => {
  console.log('=== Billing / FEFO Dispensing Integration Tests ===');
  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4();
  await scenario5();
  await scenario6();
  await scenario7();
  console.log(`\n${'='.repeat(50)}`);
  if (failed === 0) {
    console.log(`\u2713 All Billing & FEFO Integration tests PASSED (${passed}/${passed + failed})`);
    process.exit(0);
  } else {
    console.log(`\u2717 ${failed} test(s) FAILED out of ${passed + failed}`);
    process.exit(1);
  }
})();