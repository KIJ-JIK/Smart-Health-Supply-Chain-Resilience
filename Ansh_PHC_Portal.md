# Prompt Chain 3 — PHC Portal Frontend (Member 3)
### To be fed sequentially into Antigravity

This chain builds the PHC Portal exactly as scoped in masterplan §4–§23 and architecture §2.1–2.2,
in the masterplan's own Phase 1 build order, since the PHC portal is the foundation the whole
platform's core loop depends on (masterplan §84).

Feed each prompt as its own turn, in order. Do not skip ahead — later prompts assume the offline data
layer from Prompt 1 exists.

---

### Prompt 0 — Context & Project Brief
```
You are building the PHC (Primary Health Centre) Portal for "Smart Health & Supply Chain Resilience"
— the ground-level, offline-first data-capture frontend used by facility staff on low-spec Android
devices over intermittent connectivity. Two other teams build the Governance Portal and the BRICS
monitoring portal; a fourth team owns the shared backend. Your users are not analysts — assume
minimal training, no AI/supply-chain vocabulary, and frequent full offline days.

Tech stack (fixed, do not deviate): React + Vite + TypeScript, PWA via Workbox (Service Worker),
IndexedDB via Dexie.js as the local source of truth, React Query for reconciling server state once
online, Zustand for UI-only state.

Non-negotiable architectural rule for every prompt in this chain: the browser is NEVER the
authoritative inventory ledger. Every write (especially billing/dispensing) must be committed to
IndexedDB immediately and optimistically, the UI must never block on network, and the server is the
only place stock deductions become final. Do not implement any "optimistic-only" feature that skips
the local mutation-queue pattern established in Prompt 1.

Backend contract you will sync against (already specified by the backend team, build to this exact
shape): `POST /sync/push` (body: `{device_id, phc_id, client_clock, mutations: [{id, entity_type,
operation, payload, local_seq, client_timestamp}]}`, response: `{server_seq, results: [{mutation_id,
status: accepted|duplicate|rejected|conflict, server_entity_id?, error_code?, conflict?}]}`) and
`GET /sync/pull?since={server_seq}&device_id={id}&limit={n}` (response: `{server_seq, has_more,
deltas: [{server_seq, entity_type, operation, entity_id, payload, server_timestamp}]}`). Treat this
contract as fixed — do not invent your own sync payload shape.

Deliverable for this prompt only: scaffold the Vite + React + TypeScript PWA at `apps/phc-portal`,
configure Workbox for offline caching of the app shell, set up Dexie.js with placeholder tables
(you will fill in the real schema in Prompt 1), configure React Query and Zustand, and build the app
shell with bottom/side navigation exactly matching masterplan §5: Dashboard, Facility, Inventory
(Current Stock / Batches / Expiry / Consumption / Stock Movements), Billing/Dispensing, Beds, Oxygen,
Equipment, Staff (Attendance), Patient Footfall, Requests, Alerts, Emergency, Sync Status, Profile/
Settings. Add a persistent connectivity indicator (online/offline) visible on every screen.
```

### Prompt 1 — Local Data Layer & Offline Mutation Queue
```
Define the full Dexie.js schema for local IndexedDB tables mirroring the entities this PHC will read/
write offline: phc_facilities, equipment, medicines, inventory_batches, billing_transactions,
dispensed_items, staff_registry, staff_attendance, patient_footfall, resource_requests, alerts. Also include read-only local tables for geo reference: states and districts (small, synced down on first pull so the portal can display the PHC's own state/district name and construct correct scoped requests). And a
dedicated mutation_queue table with exactly these fields: id (uuid, PK), entity_type, payload (json),
device_id, local_seq (auto-incrementing per device), created_at, sync_status
('pending'|'in_flight'|'synced'|'conflict'|'failed'), retry_count, last_error. The entity_type field must be one of these exact values (fixed by the sync API contract): billing_transaction | inventory_batch_update | resource_request | footfall_entry | facility_update | staff_attendance | alert_report. Build a small
`useMutationQueue()` hook exposing `enqueue(entityType, payload)`, `listPending()`,
`markStatus(id, status, extra?)`. Every domain module built in later prompts must write through this
hook, never directly to a "committed" table, so every write is queueable and idempotent by
construction (id = the mutation's own uuid, doubling as the idempotency key expected by the backend's
`POST /sync/push`).
```

### Prompt 2 — Dashboard (masterplan §6)
```
Build the PHC Dashboard as the landing screen, showing exactly what masterplan §6 specifies, in this
priority order (status first, exceptions second, actions third — this ordering is a named UI
principle, not a suggestion): Beds (total/occupied/available/occupancy %), Oxygen (cylinders/
concentrators/available/critical status), Staff (total/present/absent/leave/shortage indicator),
Medicines (normal/warning/critical/near-expiry counts), Patients (today's OPD/emergency/admissions/
referrals). Below that, an "Attention Required" panel listing concrete flagged items (e.g. "3
medicines below threshold," "Insulin stock critical," "2 staff absent"), each clickable through to
its source module. Below that, two large primary-action buttons: "Update Resources" and "Request
Supplies." Source all figures from local IndexedDB (already-synced state), never require a network
call to render the dashboard.
```

### Prompt 3 — Facility Module (masterplan §7)
```
Build the Facility module covering: facility identity (PHC ID, name, type, district, state,
coordinates, address, contact info, operational status — mostly read-only, backend-managed), and
capacity fields the PHC user can edit (total/emergency/isolation beds, occupied beds, available beds
computed as total − occupied, available clinical facilities/emergency capability). Every edit to a
mutable field must enqueue a `facility_update` mutation via the hook from Prompt 1, not write directly
to a "live" value — the UI should optimistically show the new number immediately while the mutation
sits in `pending`.
```

### Prompt 4 — Equipment Module (masterplan §7, §16)
```
Build the Equipment module as a list of equipment records, each with type, quantity, working quantity,
non-working quantity, maintenance status, last/next service date. Support add/edit via a form that
enqueues an `equipment_update`/`equipment_create` mutation. Show a clear working-vs-non-working ratio
per item and flag any item currently under maintenance in the Dashboard's Attention Required panel
built in Prompt 2 (wire that connection now).
```

### Prompt 5 — Medicine Inventory & Batches (masterplan §8–§9)
```
Build the Inventory module's five tabs per masterplan §5's IA: Current Stock (per-medicine view:
current quantity, minimum threshold, days-of-estimated-stock, nearest expiry, status), Batches
(per-batch: batch ID, medicine, batch number, received/remaining quantity, minimum threshold, expiry
date, received date), Expiry (batches sorted by nearest expiry, with near-expiry and expired states
visually distinct), Consumption (per-medicine consumption trend, built once the billing module in
Prompt 6 starts generating events — stub with empty state for now), Stock Movements (a chronological
log of receive/adjust/dispense events).

Build the "Receive Stock" flow exactly per masterplan §9's sequence: Medicine → Batch number →
Quantity → Expiry → Source → Received date → Confirm, enqueuing an `inventory_batch_create` mutation.
Build the "Adjust Stock" flow requiring reason, quantity, user, timestamp, device, previous quantity,
and new quantity on every adjustment (masterplan §9) — do not allow a bare quantity edit without a
reason field; this is an audit requirement, not optional UX polish.
```

### Prompt 6 — FEFO Billing / Dispensing Engine UI (masterplan §10, architecture §5.1)
```
Build the Billing/Dispensing screen following the exact workflow in masterplan §10: patient/walk-in
selection (a minimal reference field or "Walk-in," never a full patient record — this platform
intentionally avoids patient-identifiable data per the architecture's security section) → medicine
selection → the UI displays available stock and lets the system auto-select the FEFO batch (nearest
expiry first) without requiring the staff member to manually pick a batch → calculate bill → confirm
dispensing. On confirm, enqueue a `billing_transaction` mutation via the Prompt 1 hook containing the
client_txn_id, patient_ref, items: [{medicine_id, quantity}], dispensed_by_staff_
id, and client_timestamp — matching the backend's checkout contract shape. Show an optimistic
"Dispensed" confirmation and a generated bill view immediately, clearly labeled as pending sync until
the mutation_queue entry reaches `synced` status (use a small sync-status icon on the bill, not a
blocking spinner). Never allow the UI to claim the transaction is server-confirmed before its queue
entry says so.
```

### Prompt 7 — Sync-Time Conflict Handling for Billing (masterplan §22–§23)
```
Build the reconciliation UI a PHC user sees when a billing mutation comes back from `POST /sync/push`
with `status: "conflict"` (conflict_type `stock_oversold`, per the backend's contract). Show the exact
server_state (available_qty vs requested_qty) and offer two clear actions: "Confirm partial dispense"
(re-issues a corrected billing mutation for the available quantity, refunding/adjusting the original
bill) or "Cancel this line" — never silently drop or silently over-fulfill a conflicted transaction.
Add a small persistent "Needs Reconciliation" badge/count visible from the Dashboard and the Sync
Status screen whenever any queue entry is in `conflict` state, since this must never be a
easy-to-miss toast notification for something that affects a real patient's medicine.
```

### Prompt 8 — Micro-Consumption Analyzer (Consumption tab, masterplan §11–§13)
```
Now that billing events exist (Prompt 6), populate the Inventory module's Consumption tab: daily,
7-day, 14-day, and 30-day consumption per medicine, computed locally from the device's own synced
billing history (do not attempt server-side forecasting on the client — this view shows historical
velocity only, the actual AI forecast lives in the Governance Portal). Compute and display a simple
projected-stockout-date estimate (current stock ÷ recent daily velocity) alongside each medicine's
status classification: NORMAL / WARNING / CRITICAL / EXPIRED / NEAR_EXPIRY exactly as defined in
masterplan §12, distinguishing current-threshold risk from projected-future risk in the UI copy (two
separate badges, not one merged label).
```

### Prompt 9 — Automated Requirement Request Drafting (masterplan §13)
```
Build the auto-draft flow: when a medicine's projected stockout falls inside a configured risk
window (read this threshold from local config synced down via `/sync/pull`, do not hardcode it), show
a suggested requirement request card on the Dashboard and Requests screen with a recommended quantity
computed from consumption history + current stock + safety buffer, sourced/tagged
`source: "auto_draft"`. The PHC user must be able to Review, Edit, Submit, or Cancel this draft before
anything is sent — never auto-submit a request without a human tap, mirroring the platform-wide
human-approval principle used throughout this system.
```

### Prompt 10 — Bed Module (masterplan §14)
```
Build the Beds screen: total, occupied, available (computed as total − occupied, never independently
editable), emergency, isolation, utilization %, and a simple historical-utilization sparkline. Every
update enqueues a mutation via the Prompt 1 hook and updates the Dashboard's bed tile immediately.
```

### Prompt 11 — Oxygen Module (masterplan §15)
```
Build the Oxygen screen: cylinders (total/available/in-use/empty/critical), concentrators (total/
working/non-working/available), last update timestamp, consumption trend, estimated days remaining,
and a configurable critical threshold (read from synced config). Flag critical status prominently on
both this screen and the Dashboard tile.
```

### Prompt 12 — Staff & Attendance Module (masterplan §17)
```
Build the Staff screen: a registry list (name, role: doctor/nurse/pharmacist/technician/other,
active/inactive) and a daily Attendance sub-screen (present/absent/leave per staff member, defaulting
to a fast bulk-mark-present-then-exception-mark-absent flow rather than requiring one tap per staff
member, since masterplan §4 requires the PHC UI to minimize interaction count). Every attendance entry
enqueues a `staff_attendance` mutation.
```

### Prompt 13 — Patient Footfall Module (masterplan §18)
```
Build the Patient Footfall screen: daily entry for OPD/Emergency/Admission/Referral counts and
disease/category-wise counts. Category values must match the server-side CHECK constraint enum exactly: opd, emergency, admission, referral, disease_infectious, disease_chronic, disease_maternal, other — do not invent new category keys locally. Plus daily/weekly/monthly historical trend views computed from local
synced history. Every footfall entry must be enqueued as a new append-only record (a fresh mutation
with a fresh uuid), never as an edit/overwrite of a previous day's count — masterplan §18 explicitly
requires these stored as append-only time-series records, and this must hold even for same-day
corrections (a correction is a new adjustment record referencing the original, not an in-place edit).
```

### Prompt 14 — Requests Module (masterplan §19)
```
Build the Requests screen: create a request (type: medicine/oxygen/bed/staff/equipment; priority:
routine/urgent/critical; reason: manual/auto-draft/threshold-breach — auto-populated for drafts from
Prompt 9. Request type enum (enforced server-side): medicine | oxygen | bed | staff | equipment. Priority enum: routine | urgent | critical. Reason: manual | auto_draft | threshold_breach (auto-populated for drafts).) and a status tracker showing each request's lifecycle (Pending → Approved → Dispatched →
In Transit → Delivered, or Pending → Rejected) as it's updated via incoming `/sync/pull` deltas.
```

### Prompt 15 — Emergency Module (masterplan §20)
```
Build the Emergency reporting screen: emergency type, severity (LOW/MEDIUM/HIGH/CRITICAL), description,
required resources, affected patients (optional, count only — no patient-identifiable detail),
timestamp. Make this the fastest-to-reach screen in the app (a persistent, always-visible emergency
button in the nav shell, not buried in a menu) since masterplan §20 specifies that CRITICAL emergency
events must enter the central alert pipeline immediately — the UI must make submitting one nearly
instantaneous even on a slow device.
```

### Prompt 16 — Alerts Module
```
Build a simple Alerts screen listing alerts relevant to this PHC (threshold breaches, maintenance
flags, request-status changes) as they arrive via `/sync/pull` deltas, each linking back to its source
module (inventory, equipment, bed, etc.) rather than duplicating that module's detail inline.
```

### Prompt 17 — Sync Engine UI & Sync Status Screen (masterplan §21–§23)
```
Build the Sync Status screen: last sync time, last successful sync time, pending mutation count,
failed mutation count, conflict count (linking to the reconciliation UI from Prompt 7), and a manual
"Sync Now" action. Implement the actual sync loop: on connectivity regained (Service Worker sync
event) or manual trigger, batch pending mutation_queue entries (respect a reasonable payload size cap,
e.g. ~200KB or 200 mutations, whichever is smaller), POST to `/sync/push`, process each result
(accepted/duplicate → mark synced; rejected → mark failed and surface the error_code to the user;
conflict → route to the Prompt 7 reconciliation flow), then loop `GET /sync/pull` using the returned
server_seq as the new watermark until `has_more` is false, applying each delta to the corresponding
local Dexie table. Implement exponential backoff with jitter (1s → 2s → 4s ... capped at 5 minutes) for
retrying a failed push, and ensure the queue survives an app restart (Dexie already persists it; verify
no queue state lives only in memory/Zustand).
```

### Prompt 18 — Offline Resilience Testing Pass
```
Add and manually exercise test scenarios for: airplane-mode billing (complete a full FEFO checkout
with no network, confirm it's queryable from the bill history immediately), app kill/restart mid-queue
(force-quit the app with pending mutations, relaunch, confirm the queue is intact and resumes), duplicate
submission (simulate a dropped ack and retry, confirm the backend's idempotency key prevents a
double-charge on the same medicine), and multi-device conflict (two simulated devices dispensing
against the same batch offline, confirm the second reconciles via Prompt 7's flow rather than silently
succeeding or silently vanishing). A PHC billing operation must never silently disappear — write this
as an explicit assertion in whatever test harness you use.
```

### Prompt 19 — Polish, Low-Spec Performance Pass, and Handoff
```
Audit the whole app for masterplan §4/§87's PHC non-functional requirements: fast startup, low memory,
minimal interaction count per common task, resilient synchronization. Reduce bundle size where
possible (code-split rarely-used screens like Settings), confirm the app shell and Dashboard render
meaningfully with zero network calls, and confirm every mutating action gives instant optimistic UI
feedback. Write `apps/phc-portal/README.md` documenting the full IndexedDB schema, the mutation-queue
contract, which config values are expected to arrive via `/sync/pull` (thresholds, risk windows), and
an explicit list of integration assumptions for the backend team (Member 4) to confirm before final
wiring. Config arrives as threshold_config_update and facility_config_update deltas from the system_config table (Dataset 21). Config keys include: min_stock_threshold_pct, critical_stock_threshold_pct, near_expiry_days, bed_occupancy_alert_pct, oxygen_critical_threshold, footfall_anomaly_sigma, forecast_horizon_days, safety_buffer_pct, sync_batch_max_mutations.
```
