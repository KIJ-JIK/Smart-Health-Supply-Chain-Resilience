# Primary Health Centre (PHC) Portal Frontend

**Smart Health & Supply Chain Resilience — National Health Operations Platform**  
*Component: Member 3 — Ground-Level Edge Frontend (`apps/phc-portal`)*

---

## 1. Overview & Architectural Principles

The PHC Portal is an **offline-first Progressive Web App (PWA)** engineered for low-spec Android tablets and desktop kiosks in rural Primary Health Centres across India. It serves as the single source of ground truth for patient footfall, medicine inventory, FEFO dispensing, bed occupancy, oxygen status, equipment health, and emergency alerts.

### Non-Negotiable Core Rules:
1. **The Browser is NEVER the Authoritative Inventory Ledger**:
   - Every write (especially billing/dispensing) is committed immediately and optimistically to local IndexedDB (`Dexie.js`) and tagged with a client-generated UUID idempotency key and Lamport `local_seq`.
   - The UI never blocks on network connectivity.
   - The server is the sole authority where final stock allocations are confirmed.
2. **Deterministic FEFO Dispensing**:
   - The system automatically allocates nearest-expiry batches first (`expiry_date ASC`) without requiring manual selection by clinical staff.
3. **Append-Only Time-Series Telemetry**:
   - Patient footfall and dispensing records are append-only time-series entries (each write generates a new unique UUID). Corrections are recorded as reference adjustment records rather than in-place overwrites.
4. **Human-in-the-Loop AI Governance**:
   - AI algorithms recommend (such as auto-drafted supply requirements based on consumption velocity); authorized human staff review, edit, and approve before submission.

---

## 2. Local IndexedDB Schema (`Dexie.js`)

Database Name: `PHC_Portal_DB` (Version 1)

| Table | Primary Key | Indexed Fields | Description |
|---|---|---|---|
| `phc_facilities` | `id` | `district_id, state_id, status` | Local PHC master record & editable capacity |
| `equipment` | `id` | `phc_id, equipment_type, maintenance_status` | Biomedical equipment & working/non-working counts |
| `medicines` | `id` | `name, category` | Essential medicine master registry |
| `inventory_batches` | `id` | `phc_id, medicine_id, batch_no, expiry_date, remaining_qty` | FEFO unit records with batch numbers and expiry |
| `stock_movements` | `id` | `phc_id, medicine_id, batch_id, type, timestamp` | Mandatory chronological audit log for all stock changes |
| `billing_transactions` | `id` | `phc_id, client_txn_id, dispensed_by_staff_id, client_timestamp, sync_status, status` | Local checkout transactions & receipts |
| `dispensed_items` | `id` | `billing_transaction_id, batch_id, medicine_id` | Line-item allocations consumed per batch |
| `staff_registry` | `id` | `phc_id, role, active` | Clinical staff directory |
| `staff_attendance` | `id` | `[staff_id+attendance_date], staff_id, phc_id, attendance_date, status` | Daily roster attendance records |
| `patient_footfall` | `id` | `phc_id, date, category, [phc_id+date+category]` | Append-only patient volume & disease telemetry |
| `resource_requests` | `id` | `phc_id, request_type, priority, status, created_at` | Requisitions submitted to District CMO |
| `alerts` | `id` | `phc_id, alert_type, severity, status, created_at` | Active operational notifications |
| `states` | `id` | `code` | Read-only state geo references |
| `districts` | `id` | `state_id, name` | Read-only district geo references |
| `system_config` | `key` | `key` | Synced policy thresholds and parameters |
| `mutation_queue` | `id` (UUID) | `entity_type, device_id, local_seq, sync_status, created_at` | Offline mutation outbox and sync state machine |

---

## 3. Backend Synchronization API Contract

The portal synchronizes against two core endpoints:

### 3.1 Push Mutations: `POST /sync/push`
**Request Payload:**
```json
{
  "device_id": "dev-phc-tab-01",
  "phc_id": "phc-varanasi-rampur-001",
  "client_clock": "2026-09-12T17:45:00.000Z",
  "mutations": [
    {
      "id": "c1f7a240-8f92-4911-9a3b-2401ef67a301",
      "entity_type": "billing_transaction",
      "operation": "create",
      "payload": {
        "client_txn_id": "c1f7a240-8f92-4911-9a3b-2401ef67a301",
        "patient_ref": "Walk-in",
        "dispensed_by_staff_id": "staff-05",
        "total_amount": 30.0,
        "items": [
          {
            "batch_id": "batch-pcm-01",
            "medicine_id": "med-01",
            "quantity": 20
          }
        ]
      },
      "local_seq": 14,
      "client_timestamp": "2026-09-12T17:45:00.000Z"
    }
  ]
}
```

**Response Payload:**
```json
{
  "server_seq": 1042,
  "results": [
    {
      "mutation_id": "c1f7a240-8f92-4911-9a3b-2401ef67a301",
      "status": "accepted",
      "server_entity_id": "c1f7a240-8f92-4911-9a3b-2401ef67a301"
    }
  ]
}
```

#### Conflict Response (`status: "conflict"`):
When multiple devices concurrently oversell a batch, the server rejects with `stock_oversold`:
```json
{
  "mutation_id": "c1f7a240-8f92-4911-9a3b-2401ef67a301",
  "status": "conflict",
  "error_code": "STOCK_OVERSOLD",
  "conflict": {
    "conflict_type": "stock_oversold",
    "server_state": { "server_remaining_qty": 5 },
    "available_qty": 5,
    "requested_qty": 20,
    "message": "Concurrent checkout reduced available batch stock to 5. Requested: 20."
  }
}
```
*The client routes this to the Prompt 7 Reconciliation UI offering "Confirm Partial Dispense" or "Cancel Line".*

---

### 3.2 Pull Authoritative Deltas: `GET /sync/pull?since={server_seq}&device_id={id}&limit={n}`
**Response Payload:**
```json
{
  "server_seq": 1050,
  "has_more": false,
  "deltas": [
    {
      "server_seq": 1045,
      "entity_type": "resource_requests",
      "operation": "update",
      "entity_id": "req-02",
      "payload": {
        "id": "req-02",
        "status": "in_transit",
        "decided_by": "Dr. A. K. Mishra (CMO)",
        "estimated_delivery": "2026-09-14"
      },
      "server_timestamp": "2026-09-12T17:30:00.000Z"
    },
    {
      "server_seq": 1046,
      "entity_type": "system_config",
      "operation": "update",
      "entity_id": "oxygen_critical_threshold",
      "payload": {
        "key": "oxygen_critical_threshold",
        "value": 5
      },
      "server_timestamp": "2026-09-12T17:30:00.000Z"
    }
  ]
}
```

---

## 4. Synced System Configuration Keys

The following keys are stored in `system_config` and synchronized down from the central data platform:

| Key | Default Value | Purpose |
|---|---|---|
| `min_stock_threshold_pct` | `20` | Stock % below which medicine status transitions to `WARNING` |
| `critical_stock_threshold_pct` | `10` | Stock % below which medicine status transitions to `CRITICAL` |
| `near_expiry_days` | `45` | Lookahead window flagging batches as `NEAR_EXPIRY` |
| `bed_occupancy_alert_pct` | `80` | Utilization percentage triggering high-occupancy warning |
| `oxygen_critical_threshold` | `5` | Available cylinder count triggering red critical alert |
| `footfall_anomaly_sigma` | `2.5` | Standard deviation boundary for surge detection |
| `forecast_horizon_days` | `30` | Planning window for auto-drafted replenishments |
| `safety_buffer_pct` | `15` | Additional buffer quantity added to auto-draft requirements |
| `sync_batch_max_mutations` | `200` | Maximum pending mutation batch size per push payload |

---

## 5. Integration Assumptions for Backend Team (Member 4)

1. **Idempotency Enforcement**: The backend must treat `mutation.id` as a strict idempotency key on all writes. If a mutation ID is seen again due to network retry, return `{ status: "duplicate" }` without re-executing stock deductions or insertions.
2. **Server-Side FEFO Locking**: Central backend must use `SELECT ... FOR UPDATE SKIP LOCKED` ordered by `expiry_date ASC` to ensure race-free atomic stock decrement across multiple edge devices.
3. **Check Constraint Enums**:
   - `patient_footfall.category`: must match `opd | emergency | admission | referral | disease_infectious | disease_chronic | disease_maternal | other`.
   - `resource_requests.request_type`: must match `medicine | oxygen | bed | staff | equipment`.
   - `resource_requests.priority`: must match `routine | urgent | critical`.
   - `resource_requests.reason`: must match `manual | auto_draft | threshold_breach`.
4. **Watermark Monotonicity**: `server_seq` in `/sync/pull` must be strictly monotonically increasing per district/PHC partition.
