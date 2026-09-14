/**
 * Facility, Resource & Inventory Integration Test Suite (Prompts 7 & 8)
 *
 * Verifies:
 *  1. Server-side computed bed metrics (available_beds, occupancy_rate)
 *  2. Role policy split on facility updates (district_admin+ vs phc_user)
 *  3. Bed, oxygen, and equipment CRUD with domain event emission
 *  4. Medicine master CRUD and Receive-Stock flow
 *  5. Stock adjustment flow: mandatory reason validation, audit recording, and stock.threshold_breached emission
 *  6. Dynamic derived stock health calculation (NORMAL, WARNING, CRITICAL, EXPIRED, NEAR_EXPIRY)
 */

import { adminPool, pool, TenantClaims } from '../src/db/pool';
import { FacilityService } from '../src/modules/facility/facilityService';
import { ResourceService } from '../src/modules/resource/resourceService';
import { InventoryService } from '../src/modules/inventory/inventoryService';
import { eventBus } from '../src/events/eventBus';

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
  console.log(' Facility, Resource & Inventory Test Suite (Prompts 7 & 8)');
  console.log('══════════════════════════════════════════════════════\n');

  // Clear event bus history
  eventBus.clearHistory();

  // Load real fixture data
  const phcRes = await adminPool.query(
    `SELECT f.id, f.district_id, f.state_id, f.name FROM phc_facilities f LIMIT 1`,
  );
  const fixturePhc = phcRes.rows[0];
  const phcId = fixturePhc.id;
  const districtId = fixturePhc.district_id;
  const stateId = fixturePhc.state_id;

  const phcUserClaims: TenantClaims = {
    sub: '00000000-0000-0000-0000-000000000001',
    role: 'phc_user',
    phcId: phcId,
    districtId: districtId,
    stateId: stateId,
  };

  const districtAdminClaims: TenantClaims = {
    sub: '00000000-0000-0000-0000-000000000002',
    role: 'district_admin',
    districtId: districtId,
    stateId: stateId,
  };

  // ---------------------------------------------------------------------------
  // 1. Scenario: Server-Side Bed Occupancy Computation
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 1: Server-Side Bed Occupancy Computation (Prompt 7)');
  const facility = await FacilityService.getFacility(phcId, phcUserClaims);
  assert('Facility retrieved successfully', !!facility && facility.id === phcId);
  assert('Total beds is numeric', typeof facility.total_beds === 'number');
  assert('Available beds computed server-side (total - occupied)',
    facility.available_beds === Math.max(0, facility.total_beds - facility.occupied_beds));
  assert('Occupancy rate computed server-side (occupied / total)',
    facility.total_beds > 0
      ? facility.occupancy_rate === Number((facility.occupied_beds / facility.total_beds).toFixed(4))
      : facility.occupancy_rate === 0);
  console.log('└─ Scenario 1 OK\n');

  // ---------------------------------------------------------------------------
  // 2. Scenario: Role Policy Split on Facility Updates (§7.2)
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 2: Role Policy Split on Facility Updates (§7.2)');

  // 2a. phc_user can update operational beds
  const updatedOp = await FacilityService.updateFacility(
    phcId,
    { total_beds: 40, occupied_beds: 25 },
    phcUserClaims,
  );
  assert('phc_user can update total and occupied beds', updatedOp.total_beds === 40 && updatedOp.occupied_beds === 25);
  assert('Bed metrics recomputed on update (available = 15)', updatedOp.available_beds === 15);
  assert('Occupancy rate recomputed on update (0.625)', updatedOp.occupancy_rate === 0.625);

  // 2b. phc_user cannot change facility administrative name
  const originalName = updatedOp.name;
  await FacilityService.updateFacility(
    phcId,
    { name: 'Unauthorized Renamed Facility' },
    phcUserClaims,
  );
  const checkNameAfterPhcUser = await FacilityService.getFacility(phcId, phcUserClaims);
  assert('phc_user cannot reassign/rename facility (name preserved)', checkNameAfterPhcUser.name === originalName);

  // 2c. district_admin can update facility administrative fields
  const newName = `PHC Center ${Date.now()}`;
  const updatedAdmin = await FacilityService.updateFacility(
    phcId,
    { name: newName },
    districtAdminClaims,
  );
  assert('district_admin can update administrative facility name', updatedAdmin.name === newName);
  console.log('└─ Scenario 2 OK\n');

  // ---------------------------------------------------------------------------
  // 3. Scenario: Resource & Equipment CRUD + Domain Events
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 3: Resource & Equipment CRUD + Events (Prompt 7)');

  // 3a. Update beds via ResourceService
  const bedSnapshot = await ResourceService.updateBeds(phcId, { total_beds: 50, occupied_beds: 30 }, phcUserClaims);
  assert('ResourceService.updateBeds returns snapshot', bedSnapshot.total_beds === 50 && bedSnapshot.available_beds === 20);

  // 3b. Update oxygen via ResourceService
  const oxSnapshot = await ResourceService.updateOxygen(phcId, { oxygen_cylinders: 18, oxygen_concentrators: 5 }, phcUserClaims);
  assert('ResourceService.updateOxygen returns snapshot', oxSnapshot.oxygen_cylinders === 18 && oxSnapshot.oxygen_concentrators === 5);

  // 3c. Register equipment
  const equipType = `ECG Monitor ${Date.now()}`;
  const equipItem = await ResourceService.createEquipment(
    phcId,
    { equipment_type: equipType, quantity: 2, working_qty: 2, maintenance_status: 'operational' },
    phcUserClaims,
  );
  assert('Equipment created with ID', !!equipItem.id);
  assert('Equipment registered to correct PHC', equipItem.phc_id === phcId);

  // 3d. Update equipment maintenance status
  const equipUpdated = await ResourceService.updateEquipment(
    phcId,
    equipItem.id,
    { working_qty: 1, maintenance_status: 'maintenance' },
    phcUserClaims,
  );
  assert('Equipment maintenance status updated to maintenance', equipUpdated.maintenance_status === 'maintenance');
  assert('Equipment working count updated to 1', equipUpdated.working_qty === 1);

  // 3e. Verify domain events emitted on event bus
  const equipEvents = eventBus.getHistory('equipment.updated');
  assert('equipment.updated events emitted on event bus', equipEvents.length >= 2);
  const bedEvents = eventBus.getHistory('bed.updated');
  assert('bed.updated events emitted on event bus', bedEvents.length >= 1);
  const oxEvents = eventBus.getHistory('oxygen.updated');
  assert('oxygen.updated events emitted on event bus', oxEvents.length >= 1);
  console.log('└─ Scenario 3 OK\n');

  // ---------------------------------------------------------------------------
  // 4. Scenario: Medicine Master & Receive-Stock Flow (Prompt 8)
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 4: Medicine Master & Receive Stock Flow (Prompt 8)');

  // 4a. Create new medicine in master catalog
  const medName = `Amoxicillin-Test-${Date.now()}`;
  const newMed = await InventoryService.createMedicine({ name: medName, category: 'Antibiotic', unit: 'strip' });
  assert('Medicine created in master catalog', !!newMed.id && newMed.name === medName);

  // 4b. Receive stock batch for this medicine
  const batchNo = `BATCH-REC-${Date.now()}`;
  const receivedBatch = await InventoryService.receiveStock(
    phcId,
    {
      medicine_id: newMed.id,
      batch_no: batchNo,
      quantity: 100,
      expiry_date: '2028-12-31',
      minimum_threshold: 20,
    },
    phcUserClaims,
  );
  assert('Stock batch received with 100 units', receivedBatch.received_qty === 100 && receivedBatch.remaining_qty === 100);
  assert('stock.received event emitted', eventBus.getHistory('stock.received').some((e) => e.payload.batch_no === batchNo));
  console.log('└─ Scenario 4 OK\n');

  // ---------------------------------------------------------------------------
  // 5. Scenario: Stock Adjustment Flow with Mandatory Reason & Threshold Breach
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 5: Stock Adjustment Flow & Threshold Breach (Masterplan §9)');

  // 5a. Attempt adjustment WITHOUT reason -> must be rejected with 400
  let caughtMissingReason = false;
  try {
    await InventoryService.adjustStock(
      phcId,
      receivedBatch.id,
      { reason: '', new_quantity: 80 },
      phcUserClaims,
    );
  } catch (err: any) {
    caughtMissingReason = err.statusCode === 400 && err.message.includes('audit reason');
  }
  assert('Adjustment missing reason strictly rejected (400 REASON_REQUIRED)', caughtMissingReason);

  // 5b. Valid stock adjustment with audit reason
  const validAdjustment = await InventoryService.adjustStock(
    phcId,
    receivedBatch.id,
    {
      reason: 'Damaged packaging during transit',
      new_quantity: 85,
    },
    phcUserClaims,
  );
  assert('Valid adjustment succeeded', validAdjustment.new_qty === 85);
  assert('Adjustment audit record created', !!validAdjustment.adjustment_id);
  assert('Previous quantity recorded as 100', validAdjustment.previous_qty === 100);
  assert('Adjustment delta recorded as -15', validAdjustment.adjustment_qty === -15);
  assert('stock.adjusted event emitted on event bus',
    eventBus.getHistory('stock.adjusted').some((e) => e.payload.adjustmentId === validAdjustment.adjustment_id));

  // 5c. Verify DB audit record in stock_adjustments table
  const auditRow = await adminPool.query(
    `SELECT previous_qty, new_qty, adjustment_qty, reason FROM stock_adjustments WHERE id = $1`,
    [validAdjustment.adjustment_id],
  );
  assert('stock_adjustments table contains audit record', auditRow.rowCount === 1);
  assert('stock_adjustments reason matches', auditRow.rows[0].reason === 'Damaged packaging during transit');

  // 5d. Adjust below minimum threshold (20) -> verify stock.threshold_breached event emitted
  eventBus.clearHistory();
  await InventoryService.adjustStock(
    phcId,
    receivedBatch.id,
    {
      reason: 'Routine physical count correction',
      new_quantity: 12, // Below minimum_threshold of 20
    },
    phcUserClaims,
  );
  const breachedEvents = eventBus.getHistory('stock.threshold_breached');
  assert('stock.threshold_breached emitted when remaining_qty drops below min threshold', breachedEvents.length === 1);
  assert('Threshold breach event contains batch and quantity details',
    breachedEvents[0].payload.remaining_qty === 12 && breachedEvents[0].payload.minimum_threshold === 20);
  console.log('└─ Scenario 5 OK\n');

  // ---------------------------------------------------------------------------
  // 6. Scenario: Live Derived Stock Health Status Calculation (Masterplan §12)
  // ---------------------------------------------------------------------------
  console.log('┌─ Scenario 6: Derived Stock Health Status Calculation (Masterplan §12)');

  // 6a. Unit test deriveStockStatus algorithm
  const todayStr = new Date().toISOString().split('T')[0];
  const nearDateStr = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  assert('Status NORMAL for healthy stock',
    InventoryService.deriveStockStatus([{ remaining_qty: 100, expiry_date: '2029-01-01', minimum_threshold: 20 }]) === 'NORMAL');

  assert('Status WARNING when stock <= minimum threshold',
    InventoryService.deriveStockStatus([{ remaining_qty: 15, expiry_date: '2029-01-01', minimum_threshold: 20 }]) === 'WARNING');

  assert('Status CRITICAL for zero stock / stockout',
    InventoryService.deriveStockStatus([{ remaining_qty: 0, expiry_date: '2029-01-01', minimum_threshold: 20 }]) === 'CRITICAL');

  assert('Status EXPIRED when expired batch has remaining stock',
    InventoryService.deriveStockStatus([{ remaining_qty: 10, expiry_date: '2020-01-01', minimum_threshold: 20 }]) === 'EXPIRED');

  assert('Status NEAR_EXPIRY when batch expires within 30 days',
    InventoryService.deriveStockStatus([{ remaining_qty: 10, expiry_date: nearDateStr, minimum_threshold: 5 }]) === 'NEAR_EXPIRY');

  // 6b. Verify getPhcInventory returns live derived status
  const inventoryList = await InventoryService.getPhcInventory(phcId, phcUserClaims);
  assert('getPhcInventory returned aggregated medicine records', inventoryList.length > 0);
  assert('Every medicine has derived health_status (NORMAL/WARNING/CRITICAL/EXPIRED/NEAR_EXPIRY)',
    inventoryList.every((item) => ['NORMAL', 'WARNING', 'CRITICAL', 'EXPIRED', 'NEAR_EXPIRY'].includes(item.health_status)));
  console.log('└─ Scenario 6 OK\n');

  console.log('══════════════════════════════════════════════════════');
  if (process.exitCode === 1) {
    console.log(' ✗  Facility & Inventory Integration tests FAILED');
  } else {
    console.log(' ✓  All Facility & Inventory Integration tests PASSED');
  }
  console.log('══════════════════════════════════════════════════════\n');

  await pool.end();
  await adminPool.end();
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
