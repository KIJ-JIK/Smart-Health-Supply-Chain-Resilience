/**
 * test_chunk12_event_catalog.ts
 *
 * Integration test suite for Chunk 12:
 *   - Event Bus Catalog & Cross-Module Wiring (Prompt 14, Masterplan §47)
 *   - Zod runtime schema validation for all 12 canonical events
 *   - Operational/telemetry events validation
 *   - EventValidationError rejection on malformed payloads
 *   - publishSafe resilient error handling
 *   - Strongly-typed subscribe / wildcard '*' fan-out
 *   - Event history buffer inspection
 *
 * No database connection required — tests in-memory event bus and contracts.
 */

import {
  eventBus,
  DomainEvent,
  EventValidationError,
  CANONICAL_EVENTS,
  OPERATIONAL_EVENTS,
  BillingTransactionCompletedPayload,
  StockThresholdBreachedPayload,
  RequestCreatedPayload,
  RequestApprovedPayload,
  RedistributionApprovedPayload,
  ShipmentDispatchedPayload,
  ShipmentDeliveredPayload,
  FootfallUpdatedPayload,
  StaffShortageDetectedPayload,
  EmergencyCreatedPayload,
  ForecastGeneratedPayload,
  AlertCreatedPayload,
} from '../src/events/eventBus';

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

async function main() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(' Chunk 12 Integration Test Suite: Event Bus Catalog & Schema Validation');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  eventBus.clearHistory();

  // ── 1. Canonical Event Topic Verification ──────────────────────────────────
  await run('1. Verify all 12 canonical event topics from Masterplan §47 are registered', async () => {
    assert(CANONICAL_EVENTS.length === 12, `exact 12 canonical events registered (found ${CANONICAL_EVENTS.length})`);
    const expected = [
      'billing.transaction_completed',
      'stock.threshold_breached',
      'request.created',
      'request.approved',
      'redistribution.approved',
      'shipment.dispatched',
      'shipment.delivered',
      'footfall.updated',
      'staff.shortage_detected',
      'emergency.created',
      'forecast.generated',
      'alert.created',
    ];
    for (const topic of expected) {
      assert(CANONICAL_EVENTS.includes(topic as any), `topic '${topic}' present in catalog`);
    }
  });

  // ── 2. Publish all 12 canonical events with valid payloads ─────────────────
  await run('2. Publish all 12 canonical events with valid schemas', async () => {
    // 1. billing.transaction_completed
    const e1 = await eventBus.publish('billing.transaction_completed', {
      transaction_id: 'txn-001',
      phc_id: 'phc-001',
      client_txn_id: 'cli-001',
      patient_ref: 'pt-12',
      total_amount: 50.0,
      item_count: 1,
      dispensed_medicine_ids: ['med-001'],
    });
    assert(e1.topic === 'billing.transaction_completed', 'e1 published');

    // 2. stock.threshold_breached
    const e2 = await eventBus.publish('stock.threshold_breached', {
      phc_id: 'phc-001',
      medicine_id: 'med-001',
      remaining_qty: 5,
      minimum_threshold: 20,
      health_status: 'CRITICAL',
    });
    assert(e2.topic === 'stock.threshold_breached', 'e2 published');

    // 3. request.created
    const e3 = await eventBus.publish('request.created', {
      id: 'req-001',
      phc_id: 'phc-001',
      request_type: 'medicine',
      item_ref: 'med-001',
      quantity: 100,
      priority: 'urgent',
      status: 'pending',
    });
    assert(e3.topic === 'request.created', 'e3 published');

    // 4. request.approved
    const e4 = await eventBus.publish('request.approved', {
      id: 'req-001',
      phc_id: 'phc-001',
      status: 'approved',
      decided_by: 'da-01',
      decided_at: new Date().toISOString(),
    });
    assert(e4.topic === 'request.approved', 'e4 published');

    // 5. redistribution.approved
    const e5 = await eventBus.publish('redistribution.approved', {
      transfer_id: 'xfer-001',
      source_phc_id: 'phc-001',
      dest_phc_id: 'phc-002',
      medicine_id: 'med-001',
      quantity: 50,
      approved_by: 'state-admin',
    });
    assert(e5.topic === 'redistribution.approved', 'e5 published');

    // 6. shipment.dispatched
    const e6 = await eventBus.publish('shipment.dispatched', {
      shipment_id: 'ship-001',
      transfer_id: 'xfer-001',
      source_phc_id: 'phc-001',
      dest_phc_id: 'phc-002',
      dispatched_at: new Date().toISOString(),
      carrier: 'State Fleet',
    });
    assert(e6.topic === 'shipment.dispatched', 'e6 published');

    // 7. shipment.delivered
    const e7 = await eventBus.publish('shipment.delivered', {
      shipment_id: 'ship-001',
      transfer_id: 'xfer-001',
      dest_phc_id: 'phc-002',
      delivered_at: new Date().toISOString(),
      received_by: 'pharmacist-02',
    });
    assert(e7.topic === 'shipment.delivered', 'e7 published');

    // 8. footfall.updated
    const e8 = await eventBus.publish('footfall.updated', {
      phc_id: 'phc-001',
      category: 'opd',
      count: 42,
      time: new Date().toISOString(),
    });
    assert(e8.topic === 'footfall.updated', 'e8 published');

    // 9. staff.shortage_detected
    const e9 = await eventBus.publish('staff.shortage_detected', {
      phc_id: 'phc-001',
      attendance_date: '2026-09-13',
      role: 'doctor',
      active_count: 2,
      present_count: 0,
      missing_count: 2,
    });
    assert(e9.topic === 'staff.shortage_detected', 'e9 published');

    // 10. emergency.created
    const e10 = await eventBus.publish('emergency.created', {
      id: 'emerg-001',
      phc_id: 'phc-001',
      alert_type: 'emergency_report',
      severity: 'critical',
      payload: { title: 'Valve Leak' },
    });
    assert(e10.topic === 'emergency.created', 'e10 published');

    // 11. forecast.generated
    const e11 = await eventBus.publish('forecast.generated', {
      phc_id: 'phc-001',
      medicine_id: 'med-001',
      forecast_type: 'daily_consumption',
      predicted_value: 28.5,
      horizon_days: 30,
      confidence_lower: 22.0,
      confidence_upper: 35.0,
      model_used: 'Prophet-v2.1',
    });
    assert(e11.topic === 'forecast.generated', 'e11 published');

    // 12. alert.created
    const e12 = await eventBus.publish('alert.created', {
      id: 'alert-001',
      alert_type: 'stock_threshold_breached',
      severity: 'HIGH',
      risk_score: 0.65,
      phc_id: 'phc-001',
    });
    assert(e12.topic === 'alert.created', 'e12 published');
  });

  // ── 3. Schema validation rejection on missing required fields ──────────────
  await run('3. Missing required fields throws EventValidationError', async () => {
    let caught = false;
    try {
      // missing transaction_id and client_txn_id
      await eventBus.publish('billing.transaction_completed', {
        phc_id: 'phc-001',
      } as any);
    } catch (err: any) {
      caught = true;
      assert(err instanceof EventValidationError, 'error is instance of EventValidationError');
      assert(err.name === 'EventValidationError', 'error name is EventValidationError');
      assert(err.topic === 'billing.transaction_completed', 'error topic is preserved');
      assert(err.issues.length > 0, `issues recorded (${err.issues.length} issues)`);
    }
    assert(caught, 'exception was thrown on invalid billing payload');
  });

  // ── 4. Schema validation rejection on invalid types ─────────────────────────
  await run('4. Invalid data types throw EventValidationError', async () => {
    let caught = false;
    try {
      // count should be number, not string; redistribution quantity must be positive
      await eventBus.publish('redistribution.approved', {
        transfer_id: 'xfer-01',
        source_phc_id: 'phc-1',
        dest_phc_id: 'phc-2',
        medicine_id: 'med-1',
        quantity: -5, // invalid: must be positive
      } as any);
    } catch (err: any) {
      caught = true;
      assert(err instanceof EventValidationError, 'caught validation error for negative quantity');
      assert(err.message.includes('positive'), 'error message explains quantity must be positive');
    }
    assert(caught, 'exception was thrown for negative quantity');
  });

  // ── 5. publishSafe resilient error handling ─────────────────────────────────
  await run('5. publishSafe catches validation error without throwing', async () => {
    const res = await eventBus.publishSafe('footfall.updated', {
      // missing required category and count
      phc_id: 'phc-001',
    } as any);

    assert(res.success === false, 'success is false');
    assert(res.error instanceof EventValidationError, 'error is EventValidationError');
    assert(res.event === undefined, 'event is undefined on failure');

    // Valid call with publishSafe
    const validRes = await eventBus.publishSafe('footfall.updated', {
      phc_id: 'phc-001',
      category: 'opd',
      count: 15,
    });
    assert(validRes.success === true, 'success is true on valid payload');
    assert(validRes.event !== undefined, 'event envelope is returned');
    assert(validRes.event?.payload.count === 15, 'payload preserved');
  });

  // ── 6. Operational event topics validation ─────────────────────────────────
  await run('6. Operational facility & stock events pass schema validation', async () => {
    const bed = await eventBus.publish('bed.updated', {
      phc_id: 'phc-001',
      total_beds: 20,
      occupied_beds: 15,
    });
    assert(bed.topic === 'bed.updated', 'bed.updated published');

    const o2 = await eventBus.publish('oxygen.updated', {
      phc_id: 'phc-001',
      oxygen_cylinders_available: 8,
    });
    assert(o2.topic === 'oxygen.updated', 'oxygen.updated published');

    const equip = await eventBus.publish('equipment.updated', {
      equipment_id: 'eq-1',
      phc_id: 'phc-001',
      status: 'operational',
    });
    assert(equip.topic === 'equipment.updated', 'equipment.updated published');

    const recv = await eventBus.publish('stock.received', {
      phc_id: 'phc-001',
      medicine_id: 'med-01',
      quantity: 500,
      batch_no: 'B2026-X',
    });
    assert(recv.topic === 'stock.received', 'stock.received published');

    const adj = await eventBus.publish('stock.adjusted', {
      phc_id: 'phc-001',
      medicine_id: 'med-01',
      adjustment_qty: -10,
      reason: 'damaged ampoule',
    });
    assert(adj.topic === 'stock.adjusted', 'stock.adjusted published');

    const chg = await eventBus.publish('request.status_changed', {
      id: 'req-01',
      status: 'dispatched',
      previous_status: 'approved',
    });
    assert(chg.topic === 'request.status_changed', 'request.status_changed published');
  });

  // ── 7. Strongly-typed subscription receives parsed event envelope ─────────
  await run('7. Strongly-typed subscriber receives full domain event envelope', async () => {
    let receivedPayload: FootfallUpdatedPayload | null = null;
    let receivedEventId = '';

    const unsub = eventBus.subscribe('footfall.updated', (event) => {
      receivedPayload = event.payload;
      receivedEventId = event.eventId;
    });

    const emitted = await eventBus.publish('footfall.updated', {
      phc_id: 'phc-sub-01',
      category: 'opd',
      count: 99,
    }, 'test-harness');

    assert(receivedPayload !== null, 'subscriber received event');
    assert((receivedPayload as any)?.count === 99, 'payload content matches');
    assert(receivedEventId === emitted.eventId, 'eventId matches published event');

    unsub();
  });

  // ── 8. Wildcard subscription receives all topics ───────────────────────────
  await run('8. Wildcard subscriber receives all events', async () => {
    const receivedTopics: string[] = [];
    const unsub = eventBus.subscribe('*', (event) => {
      receivedTopics.push(event.topic);
    });

    await eventBus.publish('request.created', {
      id: 'req-w1',
      phc_id: 'phc-001',
      status: 'pending',
    });
    await eventBus.publish('alert.created', {
      id: 'alt-w1',
      alert_type: 'shortage',
      severity: 'CRITICAL',
    });

    assert(receivedTopics.includes('request.created'), 'wildcard saw request.created');
    assert(receivedTopics.includes('alert.created'), 'wildcard saw alert.created');

    unsub();
  });

  // ── 9. Event history buffer & filtering ────────────────────────────────────
  await run('9. History buffer records events and filters by topic', async () => {
    const all = eventBus.getHistory();
    assert(all.length > 0, 'history contains events');

    const footfallEvents = eventBus.getHistory('footfall.updated');
    assert(footfallEvents.length > 0, 'history filtered by topic returns matching events');
    for (const ev of footfallEvents) {
      assert(ev.topic === 'footfall.updated', 'filtered history only contains footfall.updated');
    }

    eventBus.clearHistory();
    assert(eventBus.getHistory().length === 0, 'clearHistory resets buffer to empty');
  });

  // ── 10. Cross-Module Simulation: Billing -> Stock Threshold Breached ───────
  await run('10. Cross-Module: Billing transaction emits transaction and threshold events', async () => {
    const eventsCaught: string[] = [];
    const u1 = eventBus.subscribe('billing.transaction_completed', () => { eventsCaught.push('billing.transaction_completed'); });
    const u2 = eventBus.subscribe('stock.threshold_breached', () => { eventsCaught.push('stock.threshold_breached'); });

    // Emitted by billing service
    await eventBus.publish('billing.transaction_completed', {
      transaction_id: 'txn-cross-1',
      phc_id: 'phc-001',
      client_txn_id: 'cli-x-1',
      patient_ref: 'pt-1',
      total_amount: 120.0,
      item_count: 2,
      dispensed_medicine_ids: ['med-paracetamol'],
    }, 'billing-service');

    await eventBus.publish('stock.threshold_breached', {
      phc_id: 'phc-001',
      medicine_id: 'med-paracetamol',
      health_status: 'CRITICAL',
      triggered_by: 'billing_checkout',
    }, 'billing-service');

    assert(eventsCaught.includes('billing.transaction_completed'), 'billing event received');
    assert(eventsCaught.includes('stock.threshold_breached'), 'stock threshold event received');

    u1(); u2();
  });

  // ── 11. Cross-Module Simulation: Staff shortage -> Alert creation ──────────
  await run('11. Cross-Module: Staff shortage detected triggers alert pipeline', async () => {
    let shortageHeard = false;
    let alertHeard = false;

    const u1 = eventBus.subscribe('staff.shortage_detected', () => { shortageHeard = true; });
    const u2 = eventBus.subscribe('alert.created', () => { alertHeard = true; });

    await eventBus.publish('staff.shortage_detected', {
      phc_id: 'phc-bho-001',
      attendance_date: '2026-09-13',
      role: 'doctor',
      active_count: 3,
      present_count: 0,
      missing_count: 3,
    }, 'staff-service');

    await eventBus.publish('alert.created', {
      id: 'alt-staff-001',
      alert_type: 'staff_shortage',
      severity: 'HIGH',
      phc_id: 'phc-bho-001',
      risk_score: 0.60,
    }, 'alerts-service');

    assert(shortageHeard, 'staff shortage event heard');
    assert(alertHeard, 'alert created event heard');

    u1(); u2();
  });

  // ── 12. Cross-Module Simulation: Fast-path Emergency alert ─────────────────
  await run('12. Cross-Module: Fast-path Emergency emits emergency.created and alert.created', async () => {
    const fired: string[] = [];
    const u1 = eventBus.subscribe('emergency.created', (e) => { fired.push(e.topic); });
    const u2 = eventBus.subscribe('alert.created',     (e) => { fired.push(e.topic); });

    const emergAlert = {
      id: 'emerg-rec-99',
      phc_id: 'phc-001',
      alert_type: 'emergency_report',
      severity: 'critical',
      payload: { title: 'Power Grid Outage' },
    };

    await eventBus.publish('emergency.created', emergAlert, 'emergency-fastpath');
    await eventBus.publish('alert.created', emergAlert, 'emergency-fastpath');

    assert(fired.includes('emergency.created'), 'emergency.created emitted');
    assert(fired.includes('alert.created'), 'alert.created emitted');

    u1(); u2();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log(`Chunk 12 Tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error('\nFailed assertions:');
    failures.forEach((f) => console.error(`  • ${f}`));
    process.exit(1);
  } else {
    console.log('All Chunk 12 tests passed ✅');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
