# Event Bus Catalog & Cross-Module Wiring Specification
**Architecture Masterplan §47 & Backend Prompt 14**  
**Package:** `@smart-health/backend/events`  
**Location:** [backend/src/events/eventBus.ts](file:///c:/Users/iusan/OneDrive/Documents/build_med_tech/smart-health-platform/backend/src/events/eventBus.ts)

---

## 1. Overview & Architectural Principles

Per Masterplan §47, domain modules in the modular monolith communicate through an asynchronous internal event bus rather than direct cross-module SQL joins or database table coupling.

### Key Guarantees
1. **Schema-Validated Publication:** Every event published via `eventBus.publish(topic, payload)` is validated at runtime against its canonical [Zod](https://zod.dev) schema. Payload schema violations immediately throw `EventValidationError` with detailed issue paths, preventing silent drift between producers and consumers.
2. **Deterministic Typing:** TypeScript generic mapping (`EventPayloadMap`) ensures producers and consumers have 100% type safety on topic names and payload shapes.
3. **Resilient Publishing:** In addition to throwing `publish()`, `eventBus.publishSafe()` provides a non-throwing alternative for fire-and-forget background operations.
4. **Audit & Replay:** In-memory event buffer (`getHistory(topic)`) retains recent domain events for diagnostics, idempotency checks, and test harnesses.

---

## 2. Canonical Events Matrix (Masterplan §47)

| Event Topic | Producer Module(s) | Consumer Module(s) | Trigger / Scenario |
|---|---|---|---|
| `billing.transaction_completed` | `billingService` | `consumptionVelocity`, `audit` | Dispensing checkout transaction finalized and committed. |
| `stock.threshold_breached` | `inventoryService`, `billingService` | `autoDraftService`, `alertsService` | Remaining batch inventory drops below defined minimum threshold. |
| `request.created` | `requestService`, `autoDraftService` | `alertsService`, Governance Dashboard | Replenishment or emergency resource request initiated (manual or auto-draft). |
| `request.approved` | `requestService` | `supplyChain`, PHC Sync | Resource request approved by district admin+. |
| `redistribution.approved` | `governanceOptimizer`, Governance GraphQL | `supplyChain`, Logistics tracking | Stock redistribution between two PHCs approved by authority. |
| `shipment.dispatched` | `supplyChainService`, Logistics Gateway | PHC Inventory, Tracking | Inter-PHC stock shipment departs source facility. |
| `shipment.delivered` | `supplyChainService`, Logistics Gateway | PHC Inventory, Audit | Stock shipment received and confirmed at destination facility. |
| `footfall.updated` | `footfallService` | Syndromic Surveillance, Analytics | Append-only patient footfall observation recorded. |
| `staff.shortage_detected` | `staffService` | `alertsService`, Governance Dashboard | Attendance check reveals critical shortage (e.g. 0 active doctors on duty). |
| `emergency.created` | `requestService` (Fast-Path) | `alertsService`, SSE Stream | Critical emergency report declared by PHC staff (zero batch delay). |
| `forecast.generated` | AI Forecasting Engine | Inventory Optimization, Alerts | 30-day Prophet/LightGBM stock or demand prediction generated. |
| `alert.created` | `alertsService`, Emergency Fast-Path | `AlertsSseManager`, Governance Dashboards | Persistent governance alert created with computed risk score. |

---

## 3. Operational & Telemetry Topics

In addition to the 12 canonical events, the following operational events provide granular telemetry for resource monitoring:

| Operational Topic | Producer Module | Purpose |
|---|---|---|
| `facility.updated` | `facilityService` | General facility metadata changes. |
| `bed.updated` | `facilityService` | Real-time bed occupancy / available bed capacity update. |
| `oxygen.updated` | `facilityService` | Oxygen cylinder availability or manifold pressure change. |
| `equipment.updated` | `resourceService` | Medical equipment operational status changes (`operational`, `faulty`, etc.). |
| `stock.received` | `inventoryService` | New stock batch received and booked into inventory. |
| `stock.adjusted` | `inventoryService` | Stock quantity manually adjusted with audit reason. |
| `request.status_changed` | `requestService` | Granular request state-machine status transition audit. |

---

## 4. Canonical Payload Schemas & JSON Examples

### 1. `billing.transaction_completed`
```json
{
  "transaction_id": "txn-984021-abc",
  "phc_id": "phc-bho-001",
  "client_txn_id": "offline-client-seq-42",
  "patient_ref": "pseudo-patient-884",
  "total_amount": 140.50,
  "item_count": 2,
  "dispensed_medicine_ids": ["med-paracetamol", "med-amoxicillin"]
}
```

### 2. `stock.threshold_breached`
```json
{
  "phc_id": "phc-bho-001",
  "medicine_id": "med-paracetamol",
  "remaining_qty": 15,
  "minimum_threshold": 50,
  "health_status": "CRITICAL",
  "triggered_by": "billing_checkout"
}
```

### 3. `request.created`
```json
{
  "id": "req-00192",
  "phc_id": "phc-bho-001",
  "request_type": "medicine",
  "item_ref": "med-paracetamol",
  "quantity": 100,
  "priority": "urgent",
  "source": "auto_draft",
  "status": "pending"
}
```

### 4. `request.approved`
```json
{
  "id": "req-00192",
  "phc_id": "phc-bho-001",
  "status": "approved",
  "decided_by": "user-district-admin-1",
  "decided_at": "2026-09-13T18:20:00.000Z",
  "notes": "Allocation confirmed from central district warehouse"
}
```

### 5. `redistribution.approved`
```json
{
  "transfer_id": "xfer-0912",
  "source_phc_id": "phc-surplus-002",
  "dest_phc_id": "phc-deficit-001",
  "medicine_id": "med-insulin-r",
  "quantity": 30,
  "approved_by": "user-state-admin",
  "approved_at": "2026-09-13T18:21:00.000Z"
}
```

### 6. `shipment.dispatched`
```json
{
  "shipment_id": "ship-5501",
  "transfer_id": "xfer-0912",
  "source_phc_id": "phc-surplus-002",
  "dest_phc_id": "phc-deficit-001",
  "dispatched_at": "2026-09-13T18:22:00.000Z",
  "tracking_ref": "LOG-IND-2026-9912",
  "carrier": "State Medical Supply Fleet"
}
```

### 7. `shipment.delivered`
```json
{
  "shipment_id": "ship-5501",
  "transfer_id": "xfer-0912",
  "dest_phc_id": "phc-deficit-001",
  "delivered_at": "2026-09-13T19:00:00.000Z",
  "received_by": "phc-pharmacist-01"
}
```

### 8. `footfall.updated`
```json
{
  "phc_id": "phc-bho-001",
  "category": "opd",
  "count": 48,
  "time": "2026-09-13T18:00:00.000Z"
}
```

### 9. `staff.shortage_detected`
```json
{
  "phc_id": "phc-bho-001",
  "attendance_date": "2026-09-13",
  "role": "doctor",
  "active_count": 3,
  "present_count": 0,
  "missing_count": 3
}
```

### 10. `emergency.created`
```json
{
  "id": "alert-emerg-101",
  "phc_id": "phc-bho-001",
  "alert_type": "emergency_report",
  "severity": "critical",
  "payload": {
    "title": "Oxygen Valve Failure",
    "description": "Manifold line leak, auxiliary backup running low"
  }
}
```

### 11. `forecast.generated`
```json
{
  "phc_id": "phc-bho-001",
  "medicine_id": "med-paracetamol",
  "forecast_type": "daily_consumption",
  "predicted_value": 35.4,
  "horizon_days": 30,
  "confidence_lower": 28.1,
  "confidence_upper": 42.7,
  "model_used": "Prophet-v2.1",
  "generated_at": "2026-09-13T00:00:00.000Z"
}
```

### 12. `alert.created`
```json
{
  "id": "alert-rec-7712",
  "phc_id": "phc-bho-001",
  "district_id": "dist-bhopal",
  "state_id": "state-mp",
  "alert_type": "stock_threshold_breached",
  "severity": "HIGH",
  "risk_score": 0.65,
  "status": "open",
  "payload": {
    "medicine_id": "med-paracetamol",
    "remaining_qty": 15
  }
}
```

---

## 5. Usage Guidelines for Backend Developers

### Publishing Events
```typescript
import { eventBus } from '../events/eventBus';

// Standard publish (throws EventValidationError if payload is invalid):
await eventBus.publish('footfall.updated', {
  phc_id: 'phc-001',
  category: 'opd',
  count: 25,
  time: new Date().toISOString(),
}, 'footfall-service');

// Safe publish (catches error and returns { success, event, error }):
const res = await eventBus.publishSafe('billing.transaction_completed', payload, 'billing-service');
if (!res.success) {
  logger.error('Failed to publish transaction completed event', res.error);
}
```

### Subscribing to Events
```typescript
import { eventBus, DomainEvent, FootfallUpdatedPayload } from '../events/eventBus';

// Strongly-typed subscription:
const unsubscribe = eventBus.subscribe('footfall.updated', async (event: DomainEvent<FootfallUpdatedPayload>) => {
  console.log(`Received footfall count ${event.payload.count} for PHC ${event.payload.phc_id}`);
});

// Wildcard listener (e.g. audit logger or telemetry sink):
eventBus.subscribe('*', async (event: DomainEvent) => {
  auditSink.record(event.topic, event.source, event.timestamp);
});
```
