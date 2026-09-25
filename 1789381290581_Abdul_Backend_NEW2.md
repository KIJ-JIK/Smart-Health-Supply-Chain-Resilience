# Prompt Chain 4 — Shared Backend (Member 4)
### To be fed sequentially into Antigravity

This chain builds the single shared backend that the PHC Portal (Member 3), Governance Portal
(Member 2), and BRICS Portal (Member 1) all consume — one platform, shared contracts, shared identity,
shared data, shared event model, shared audit (masterplan §91). It follows the masterplan's own
recommended engineering sequence (§92) and reuses, verbatim, the schemas, RLS policies, and OpenAPI
sync contract already produced in the architecture design document — do not redesign these, implement
them.

Feed each prompt as its own turn, in order. Do not skip ahead — later prompts assume earlier schema/
service layers exist.

---

### Prompt 0 — Context & Project Brief
```
You are building the shared backend for "Smart Health & Supply Chain Resilience." Three frontend
teams depend on you: PHC Portal (offline-first PWA, low-spec devices, intermittent connectivity),
Governance Portal (national/state/district decision dashboard), and a BRICS federated-learning
monitoring portal. You are the single source of truth for every operational entity — no frontend may
maintain its own authoritative copy of anything (masterplan §68).

Service pattern (fixed, justified in the architecture doc — do not deviate without strong reason):
Modular Monolith with strict domain-isolated modules for Phases 0–2, each module owning its own
schema/tables, communicating only via an internal event bus, never via cross-module SQL joins.
Extraction candidates for later phases: the AI/forecasting/optimization engine and the federated-
learning coordinator — build the module boundaries now so those extractions are clean later.

Tech stack: Node.js/TypeScript for the core API layer, REST/OpenAPI for PHC-facing transactional
writes, GraphQL for governance-facing reads, SSE for alert/KPI streaming, WebSocket for the crisis
simulator and copilot streaming. PostgreSQL + PostGIS for transactional/geo data, TimescaleDB for
telemetry/time-series, Redis for caching/session/geo-caching, Kafka or RabbitMQ as the event bus,
OAuth2/OIDC for identity, JWT (short-lived, ~15 min access tokens + refresh tokens), device
certificates for PHC device binding.

Modules to scaffold now (empty, but structurally present, matching the monorepo layout the whole
team has agreed on): auth, facilities, inventory, billing, resources, workforce, footfall, requests,
alerts, supply-chain, audit, plus a top-level events package and an api-contracts/types/validation
shared package consumed by all modules.

Deliverable for this prompt only: scaffold the monorepo skeleton exactly as:
smart-health-platform/backend/{api, modules/{auth,facilities,inventory,billing,resources,workforce,
footfall,requests,alerts,supply-chain,audit,sync,config,federation}, events}, plus packages/{api-contracts,types,validation,
auth}, plus database/{migrations,seeds,rls}, plus infrastructure/{docker,kubernetes,terraform}. Set
up Docker Compose with PostgreSQL (with PostGIS extension enabled), TimescaleDB, Redis, and a message
broker (choose Kafka or RabbitMQ and justify the choice in a short ADR file — throughput/ordering
needs for high-frequency small transactional events vs. operational simplicity), so the whole team can
run the stack locally with one command. Set up CI (lint, typecheck, test) and a basic health-check
endpoint.
```

### Prompt 1 — Domain Model & Database Schema
```
Implement the full PostgreSQL schema exactly as specified in the final architecture document §4.1 and the datasets/schemas/ files — create migrations in this exact execution order (later layers depend on earlier ones):

Layer 1 — Geography & Foundation (datasets/schemas/01_geography_foundation.sql):
  - states (UUID PK, name, country)
  - districts (UUID PK, name, state_id FK)
  - phc_facilities (UUID PK; PostGIS GEOGRAPHY(POINT,4326) location column + GIST index; district_id UUID FK, state_id UUID FK — no ltree; beds/oxygen as operational columns; RLS enabled)
  - equipment (UUID PK, phc_id FK)
  - medicines (UUID PK, name, category, unit)
  - inventory_batches (UUID PK, phc_id FK, medicine_id FK; UNIQUE(phc_id, medicine_id, batch_no); FEFO partial index on (phc_id, medicine_id, expiry_date) WHERE remaining_qty > 0; minimum_threshold column)

Layer 2 — PHC Operations (datasets/schemas/02_phc_operations.sql):
  - staff_registry (UUID PK, phc_id FK, role CHECK enum)
  - billing_transactions (UUID PK, phc_id FK; client_txn_id UNIQUE as idempotency key; patient_ref pseudonymous only)
  - dispensed_items (UUID PK; billing_transaction_id FK, batch_id FK, medicine_id FK)
  - staff_attendance (UUID PK, staff_id FK; UNIQUE(staff_id, attendance_date))
  - resource_requests (UUID PK, phc_id FK; request_type CHECK, priority CHECK, status state machine)
  - mutation_queue (UUID PK; UNIQUE(phc_id, device_id, local_seq) — server-side sync audit log; sync_status CHECK)

Layer 3 — TimescaleDB (datasets/schemas/03_timeseries.sql):
  - patient_footfall hypertable (time, phc_id, category CHECK enum, count)
  - consumption_velocity hypertable (time, phc_id, medicine_id, qty_dispensed)
  - consumption_daily continuous aggregate (from consumption_velocity; refresh policy: every 1 hour)

Layer 4 — Governance & Intelligence (datasets/schemas/04_governance_intelligence.sql):
  - alerts (UUID PK; unified table: alert_type CHECK enum includes emergency_report; district_id + state_id columns for national-level alerts per §7.5)
  - redistribution_transfers (UUID PK; source_phc_id FK, dest_phc_id FK; status state machine recommended→approved→in_transit→delivered; RLS scoped through BOTH source and dest phc)
  - reconciliation_events (UUID PK; redistribution_transfer_id FK, triggered_by_txn_id FK; saga state machine)
  - audit_log (UUID PK; append-only; CREATE RULE blocking UPDATE and DELETE at DB level; fields: actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, phc_id, district_id, state_id, source_ip, device_id, correlation_id, ai_rec_payload, created_at)
  - forecast_predictions (UUID PK; phc_id FK, district_id FK, medicine_id FK; forecast_type CHECK enum; predicted_value, confidence_lower, confidence_upper; model_used, model_version, generated_at; UNIQUE per phc+medicine+date+type+model)
  - system_config (config_key, config_value, scope CHECK, scope_id; UNIQUE(config_key, scope, scope_id))

Layer 5 — BRICS Federated (datasets/schemas/05_brics_federated.sql):
  - federation_rounds (UUID PK; hash-chained: previous_entry_hash + this_hash; status CHECK)
  - privacy_budget_ledger (UUID PK; UNIQUE(country_id, federation_round_id); CHECK(cumulative_epsilon <= budget_limit) — structural privacy floor)
  - federation_model_versions (UUID PK; model_version UNIQUE; status CHECK)

Materialized Views (created after base tables):
  - gis_facility_risk (from phc_facilities + alerts; for Deck.gl GIS heatmap)
  - federation_training_features (from consumption_daily; read-only for federated learning service; never contains patient-identifiable data)

Seed using the files in datasets/seeds/output/ — 23 JSON seed files covering all 26 datasets (3 are derived views with no seed file). Load in dataset order: 01_states → 02_districts → 03_phc_facilities → 04_equipment → 05_medicines → 06_inventory_batches → 07_staff_registry → 08_staff_attendance → 09_billing_transactions → 10_dispensed_items → 11_resource_requests → 12_mutation_queue → 13_patient_footfall → 14_consumption_velocity → 16_alerts → 17_redistribution_transfers → 18_reconciliation_events → 19_audit_log → 20_forecast_predictions → 21_system_config → 24_federation_rounds → 25_privacy_budget_ledger → 26_federation_model_versions. This gives every frontend team a realistic multi-state, multi-district, 120-PHC dataset to develop against immediately.
```

### Prompt 2 — Row-Level Security Policies
```
Implement the full RLS policy suite exactly as specified in the architecture document §7 — the
app_current_role()/app_current_phc_id()/app_current_district_id()/app_current_state_id() helper
functions, and CREATE POLICY statements for phc_facilities, inventory_batches, and resource_requests
(including the split between visibility policies and decision policies on resource_requests), plus the
same EXISTS-join pattern extended to equipment, billing_transactions, dispensed_items, staff_registry,
staff_attendance, alerts (with state_id/district_id columns added for national-level synthetic alerts
as noted in §7.5), and redistribution_transfers (scoped through both source_phc_id and dest_phc_id). Also apply RLS to mutation_queue: phc_user sees only their own phc_id's rows; district_admin and above see their jurisdiction's rows (via EXISTS join to phc_facilities) for sync monitoring purposes.
Apply FORCE ROW LEVEL SECURITY on every tenant-scoped table. Set up the middleware that maps a
validated JWT's claims into SET LOCAL app.current_role/current_phc_id/current_district_id/
current_state_id at the start of every request transaction — this must run before any query touches a
protected table. Do not implement any query path, anywhere in the system, that bypasses this
middleware "for convenience" (e.g. a debug endpoint using a superuser connection) — if one is genuinely
needed for migrations/seeding, it must be a clearly separate, non-request-serving role.
```

### Prompt 3 — RLS Integration Test Matrix
```
Before building any more business logic, write the integration test suite the architecture document
identifies as the single highest-leverage security investment (§7.5): run the same set of queries
(select on phc_facilities, inventory_batches, resource_requests, alerts, redistribution_transfers)
as each of national_admin, state_admin, district_admin, phc_user against the fixture data seeded in
Prompt 1, and assert exact row-count/identity expectations for each role — not just "returns something,"
but the precise set of rows each role should and should not see. This test suite must run in CI on
every future migration touching these tables.
```

### Prompt 4 — Authentication, RBAC, and Device Binding
```
Implement the auth module: OAuth2/OIDC integration (assume an external identity provider, e.g.
Keycloak, is available — integrate against it, do not build your own password store), JWT issuance
with the four roles (national_admin, state_admin, district_admin, phc_user) and their scope claims
(state_id/district_id/phc_id as appropriate), short-lived access tokens (~15 min) plus refresh tokens,
and a device-binding mechanism for PHC devices (issue a device certificate/key pair on first
registration, require it alongside the user's token for any /phc/{phcId}/* write, so a stolen user
credential alone is insufficient to write from an unrecognized device). Wire this into the RLS
session-claim middleware from Prompt 2 so every authenticated request automatically sets the correct
Postgres session variables.
```

### Prompt 5 — API Contracts & Shared Types
```
Set up the packages/api-contracts package as the single source of truth for request/response shapes,
shared by the API layer and (via generated types) available to the three frontend teams. Implement the
OpenAPI specification for the PHC-facing REST surface (facility, inventory, billing, beds, oxygen,
equipment, staff, footfall, requests, emergency endpoints under /api/v1/phc/{phcId}/*) and draft the
GraphQL schema for the governance-facing read surface (nationalOverview, stateOverview, districtOverview,
phcDetail, medicineIntelligence, resourceIntelligence, workforceIntelligence, patientIntelligence,
forecasts, redistributionRecommendations, supplyChainShipments, auditLog — matching the fields the
Governance Portal team was told to expect). Publish these as versioned packages/generated clients so
frontend teams are not blocked waiting on your running server to start integrating against types.
```

### Prompt 6 — Sync Engine (`POST /sync/push`, `GET /sync/pull`)
```
Implement the sync endpoints exactly to the OpenAPI contract in the architecture document §8.2 —
SyncPushRequest/SyncPushResponse/Mutation/MutationResult/ConflictDetail/SyncPullResponse/Delta schemas,
verbatim field names. Implement push as: validate the envelope, authorize phc_id against the token's
device binding, process each mutation with its id as the idempotency key (upsert semantics — a retried
mutation_id must never double-apply), route each mutation to its owning domain module (billing,
facility, inventory, footfall, etc. — built in later prompts) inside its own transaction, assign a new
server_seq per accepted mutation, and return per-mutation results including the stock_oversold conflict
shape from §8.3 for billing mutations that can't be fully satisfied. Implement pull as: return deltas
(redistribution approvals, request status changes, alerts, threshold/config updates, facility config
updates) since the given watermark, paginated via has_more, and implement the 410 Gone response for a
watermark older than the server's retention window (client must fall back to a full resync). Write
integration tests for the exact conflict/idempotency scenarios described in the architecture doc's
client sync-loop reference (§8.4): duplicate push retry, two devices racing the same batch, and a
stale watermark triggering 410.
```

### Prompt 7 — Facility & Resource Modules
```
Implement the facilities module (CRUD for phc_facilities respecting RLS — district_admin+ only for
create/reassign, phc_user limited to their own facility's operational fields per the architecture's
§7.2 policy split) and the resources module covering beds (available = total − occupied,
occupancy_rate = occupied / total, computed server-side, never trusted from the client), oxygen, and
equipment. Every mutation must emit a domain event (e.g. facility.updated, bed.updated,
oxygen.updated, equipment.updated) onto the event bus scaffolded in Prompt 0, even where no consumer
exists yet — the event contract is part of the system's shared language and must exist from the start
per masterplan §47.
```

### Prompt 8 — Inventory & Batch Module
```
Implement the inventory module: medicines master CRUD, inventory_batches CRUD (receive-stock flow:
medicine → batch number → quantity → expiry → source → received date), and the "adjust stock" flow
requiring reason, quantity, user, timestamp, device, previous quantity, new quantity on every
adjustment (masterplan §9) — reject any stock-adjustment mutation missing a reason. Compute and expose
per-medicine current status (NORMAL/WARNING/CRITICAL/EXPIRED/NEAR_EXPIRY per masterplan §12) as a
derived field, not a stored one, so it's always consistent with live batch data. Emit
stock.threshold_breached whenever an adjustment or dispensing event (Prompt 9) drops remaining_qty
below minimum_threshold.
```

### Prompt 9 — Billing / FEFO Dispensing Engine
```
Implement the billing module's checkout flow exactly per the architecture document's §3.3.1 endpoint
contract and §5.1 FEFO algorithm: SELECT ... FOR UPDATE SKIP LOCKED ordered by expiry_date ASC across
candidate batches, deduct across one or more batches until the requested quantity is satisfied or
stock is exhausted (in which case return 409 INSUFFICIENT_STOCK with the max fulfillable quantity, and
the same shape surfaces as a sync conflict when arriving via the offline sync path rather than a
direct online call), write billing_transactions + one dispensed_items row per batch consumed, recompute
threshold status, and emit billing.transaction_completed. This transaction must be idempotent on
client_txn_id regardless of whether it arrives via a direct REST call (online PHC) or via the sync
engine's mutation queue (offline PHC) — implement it once, and have both entry points call the same
underlying service function so there is exactly one FEFO implementation in the system, not two that
can drift apart.
```

### Prompt 10 — Micro-Consumption Velocity Pipeline
```
Wire billing.transaction_completed to write into the consumption_velocity hypertable (Prompt 1) and
confirm the consumption_daily continuous aggregate reflects it. Implement the automated-requirement-
request drafting logic from masterplan §13: consumption history + current stock + a naive
forecast (a simple moving-average projection is sufficient at this stage — the full Prophet/XGBoost
pipeline is a later, separate AI-layer prompt) + a configurable safety buffer → a recommended
quantity → auto-drafted resource_requests row tagged reason='auto_draft' or trigger threshold-breach
tagged reason='threshold_breach', left in a state the PHC user must review/edit/submit/cancel — never
auto-submit without that human step, consistent with what the PHC frontend team was told to build.
```

### Prompt 11 — Staff, Attendance & Footfall Modules
```
Implement the workforce module (staff_registry CRUD, staff_attendance recording) and the footfall
module (patient_footfall hypertable writes). Enforce footfall as strictly append-only at the API
level — reject any request attempting to update/overwrite a previous day's count; a correction must be
submitted as a new adjustment record referencing the original, matching what the PHC frontend team was
told (masterplan §18).
```

### Prompt 12 — Requests & Emergency Module
```
Implement the requests module's full lifecycle (pending → approved → dispatched → in_transit →
delivered, or pending → rejected) with the decision-authority RLS policy from Prompt 2 enforced
(district_admin+ only, within their own jurisdiction). Implement the emergency reporting endpoint,
ensuring any CRITICAL-severity emergency immediately emits an event that the alerts module (Prompt 13)
picks up with no batch delay — this path must be as close to synchronous/immediate as the architecture
allows, per masterplan §20.
```

### Prompt 13 — Alerts & Risk Engine
```
Implement the alerts module: a consumer of stock.threshold_breached, bed/oxygen threshold crossings,
and staff-shortage conditions, writing immediate/deterministic alerts (masterplan §34's first class).
Implement a basic risk-scoring service combining current shortage risk, consumption acceleration, and
emergency severity into a LOW/MODERATE/HIGH/CRITICAL classification per resource
(architecture/masterplan §35) — implement the weights as configuration values (Prompt 16), never
hardcoded constants, since the masterplan explicitly requires production weights to be configurable.
Expose alerts via the `/api/v1/governance/alerts/stream` SSE endpoint the Governance Portal team was
told to expect.
```

### Prompt 14 — Event Bus Catalog & Cross-Module Wiring
```
Formalize the full event catalog from masterplan §47 (billing.transaction_completed,
stock.threshold_breached, request.created, request.approved, redistribution.approved,
shipment.dispatched, shipment.delivered, footfall.updated, staff.shortage_detected,
emergency.created, forecast.generated, alert.created) as typed events in the shared events package,
with a schema-validated publish/subscribe wrapper so producers and consumers can't silently drift on
payload shape. Confirm every module built so far (Prompts 7–13) publishes its events through this
wrapper rather than ad hoc broker calls.
```

### Prompt 15 — Governance Read Layer (GraphQL Resolvers)
```
Implement the GraphQL resolvers for the schema drafted in Prompt 5 (nationalOverview,
stateOverview, districtOverview, phcDetail, medicineIntelligence, resourceIntelligence,
workforceIntelligence, patientIntelligence, redistributionRecommendations, supplyChainShipments,
auditLog), each resolver respecting the caller's RLS scope automatically via the same JWT-claims
middleware from Prompt 2 (a GraphQL request is still a request — it must set the same Postgres session
variables before touching the database). Cache expensive aggregate queries (national/state rollups) in
Redis with a short TTL and expose a last-computed timestamp on every aggregate response so the
Governance Portal's DataFreshnessLabel has a real value to render, not a client-side guess.
```

### Prompt 16 — Configuration Management
```
Implement a configuration module for the versioned, audited thresholds from masterplan §69 (minimum
stock, critical stock, near-expiry period, bed occupancy threshold, oxygen critical threshold, footfall
anomaly threshold, alert severity weights, forecast horizon, safety buffer, redistribution rules). The backing table is system_config (Dataset 21) with columns: config_key, config_value, scope (global/state/district/phc), scope_id (state_id/district_id/phc_id for non-global scopes), description, updated_by, updated_at. PHC-specific overrides use scope='phc' with scope_id=phc_id and take precedence over global defaults. Standard config keys: min_stock_threshold_pct, critical_stock_threshold_pct, near_expiry_days, bed_occupancy_alert_pct, oxygen_critical_threshold, footfall_anomaly_sigma, forecast_horizon_days, safety_buffer_pct, redistribution_max_distance_km, sync_batch_max_mutations.
Every change must be versioned and written to the audit log (Prompt 18). Expose current config values
to PHC devices through the existing `/sync/pull` delta stream (as a `facility_config_update` /
`threshold_config_update` delta type) so devices always have the latest thresholds available locally
even offline, per the PHC frontend team's expectations from their own build.
```

### Prompt 17 — AI Pipeline Integration Points (Forecasting, Optimization, Simulator, Copilot)
```
Build this prompt's deliverable as integration seams, not full model implementations (the actual
Prophet/XGBoost/LSTM/OR-Tools/RAG work is a separate AI-engineering track) — implement: (a) a
forecasting-service client interface the core backend calls on a schedule (nightly batch) per the
champion/challenger design in the architecture doc §5.2, storing results in the forecast_predictions table (Dataset 20) matching
the Forecast Output Contract fields (phc_id, district_id, medicine_id, forecast_type, forecast_date, horizon_days, predicted_value, confidence_lower, confidence_upper, model_used, model_version, generated_at); (b) a redistribution-optimizer client
interface following the MILP formulation in §5.4, writing ranked recommendations into
redistribution_transfers with status='recommended'; (c) the WebSocket-backed
`/api/v1/governance/simulator/session` endpoint implementing the deterministic pipeline from §5.5
(apply scenario deltas → re-forecast → re-optimize → return results), with Monte Carlo as a
configurable mode returning P50/P90 bands; (d) a scoped-retrieval endpoint backing the Governance
Copilot, enforcing role-based row filtering before any context reaches the LLM call, and returning the
full Copilot Response Contract shape (answer, supporting data, source alert/recommendation ID,
timestamp, model version, confidence) the Governance Portal team was told to expect. Stub the actual
model inference behind each interface with a clearly-labeled placeholder implementation the AI track
can replace without changing the contract.
```

### Prompt 18 — Federated Learning Coordinator Stub (BRICS)
```
Implement the federated.* GraphQL surface the BRICS Portal team was told to expect
(federatedNodes, federatedRounds, federatedModelVersions, federatedPrivacyBudget) and the mutations
(startFederatedRound, approveAggregatedModel, rejectAggregatedModel, toggleCountryParticipation),
backed for now by a stub/simulated coordinator (fixed 5-node roster: India, Brazil, Russia, China,
South Africa) rather than a live cross-border Flower deployment — this is explicitly a Phase 5,
architected-for-not-yet-live capability per the masterplan. Ensure no mutation here can ever be called
by anything other than national_admin, and that no path exists for raw PHC-level data to be included
in any payload this module touches — only aggregate model artifacts, matching the architecture's
"raw records never cross this boundary" requirement. Backing tables: federation_rounds (hash-chained round ledger; previous_entry_hash + this_hash must be computed and stored), privacy_budget_ledger (UNIQUE(country_id, federation_round_id); CHECK(cumulative_epsilon <= budget_limit) is a structural DB constraint — do not bypass it), federation_model_versions (status lifecycle: received → validated → active → deprecated). The federation_training_features materialized view (from consumption_daily) is the ONLY source the federated learning client may read — it is refreshed on a schedule and never contains patient-identifiable data. Grant SELECT on it only to the federated_learning_service DB role.
```

### Prompt 19 — Supply Chain Module
```
Implement the supply-chain module: shipment tracking records (item, quantity, source, destination,
dispatch time, expected/actual delivery, status, delay flag) created automatically when a
redistribution_transfers row is approved (consume redistribution.approved), updated as
shipment.dispatched/shipment.delivered events arrive (from an external logistics integration or a
manual status-update endpoint for the prototype), and a supplier-performance/delay-analytics query
surface for the Governance Portal's Supply Chain module.
```

### Prompt 20 — Audit System
```
Implement the audit module as a genuinely append-only store: a dedicated database role with INSERT-
only grants (no UPDATE/DELETE at the database level, for any application role, matching the
architecture doc's §6.3 requirement), auto-instrumented at the middleware level for every write to
billing_transactions, resource_requests, redistribution_transfers, and every cross-tenant read,
capturing actor, role, action, entity, before/after diff, timestamp, IP, device, correlation ID, and
(where applicable) the triggering AI recommendation payload. Expose the read side via the auditLog
GraphQL resolver from Prompt 15, itself scoped by jurisdiction exactly as specified.
```

### Prompt 21 — Observability, Load, and Disaster-Recovery Foundations
```
Add request-level structured logging (request_id, correlation_id, user_id, device_id, phc_id,
timestamp, service, operation, latency, status) across every module. Add basic dashboards/alerts for
API latency, error rate, sync failures, queue depth, event lag, DB latency. Set up automated PostgreSQL
backups with point-in-time recovery and document (do not necessarily fully implement yet) target RPO/
RTO values as an explicit open question for the team to confirm before production, per masterplan §75.
Write a basic load-test script simulating concurrent billing checkouts and sync-push batches at
increasing PHC counts (1 → 10 → 100 → 1,000) against the Prompt 9 and Prompt 6 endpoints, and record
where latency/throughput first degrades so the modular-monolith-vs-extraction decision from Prompt 0
has real data behind it later.
```

### Prompt 22 — Cross-Team Integration Pass
```
Do a final pass reconciling this backend against the three frontend teams' README "assumptions"
documents (produced at the end of each of their prompt chains): confirm the BRICS portal's mocked
federated.* schema matches Prompt 18's real schema field-for-field, confirm the Governance Portal's
mocked GraphQL fields match Prompt 15's real resolvers, and confirm the PHC Portal's assumed
mutation_queue/sync contract matches Prompt 6 exactly. Log every mismatch as a tracked issue rather
than silently changing a contract — contract changes at this stage must be a visible, cross-team
decision, not a quiet one-sided fix.
```

---

## Addendum — NEW prompts added after gap analysis (not part of the original chain fed into Antigravity)

**Why this was added**: Prompt 17 above explicitly scoped the real model work out as "a separate
AI-engineering track... Stub the actual model inference behind each interface with a clearly-labeled
placeholder implementation the AI track can replace without changing the contract," and Prompt 18
stubbed the federated coordinator the same way. That "AI track" was never actually written as its own
prompt chain — there is no fifth team member to own it, so it belongs here, as a continuation of the
shared backend chain, using the same Python/`ai/`-directory boundary the masterplan already specifies
(§66–§67) even though Node.js/TypeScript is the language for the rest of this chain. Treat Prompts
23–32 as a distinct engineering phase within this same chain (different language, different repo
subtree, likely a different deploy target per masterplan §77) rather than as more Node.js modules —
but still one chain, one team member, fed sequentially like everything above. Prompt 33 then wires it
into Prompts 17–18's placeholders. Nothing in Prompts 0–22 above changes.

### Prompt 23 — AI Engine Scaffold & Access Boundaries
```
Scaffold a top-level `ai/` directory (sibling to `backend/`, not a module inside it — masterplan §67)
with subfolders `forecasting/`, `anomaly/`, `risk/`, `optimizer/`, `simulator/`, `copilot/`,
`federated/`, matching the extraction boundary already named in Prompt 0 above and masterplan §77
(forecasting, optimization, federated learning, and copilot are the named future microservice
extraction candidates — build the boundary now even though it ships in this same repo/chain for now).
Use Python for everything under `ai/` (masterplan §66: Prophet, XGBoost, PyTorch where required,
OR-Tools, Flower) — this is a deliberate language switch from the Node.js/TypeScript core API; keep the
two cleanly separated, communicating only through the DB, the event bus, and the HTTP/WebSocket
interfaces Prompts 17–18 already defined, never through direct in-process calls.

Give each `ai/` subfolder its own dedicated, narrowly-scoped read-only Postgres role (never the
application's transactional role) — a feature-store role limited to consumption_daily,
patient_footfall, and system_config; a federated role limited to federation_training_features only
(already granted in Prompt 18); no subfolder gets write access to any table this prompt doesn't
explicitly name in Prompts 25–31. Every model shipped from here on must be versioned, backtestable,
and roll-back-able (masterplan §64), and every prediction must carry an uncertainty band rather than a
bare point estimate (masterplan §88.9). Nothing under `ai/` writes a status that skips human approval —
`redistribution_transfers.status` only ever starts at `'recommended'` from this code, never
`'approved'`, matching the "AI recommends, officer decides" principle already enforced everywhere else
in this chain.
```

### Prompt 24 — Feature Store & Read-Only Data Access Layer
```
Build the shared feature-generation layer every model below depends on (masterplan §63's "Feature
Generation" stage). Read from consumption_daily (Dataset 15) and patient_footfall (Dataset 13) to
compute, per PHC-medicine pair: 7/14/30-day rolling consumption, footfall trend, disease-category
counts, and seasonality features (day-of-week, month). Read forecast-relevant config
(forecast_horizon_days, safety_buffer_pct, and the anomaly/risk thresholds) from system_config through
the same scope-resolution rule Prompt 16 above already implements (phc-scope overrides district/state/
global) rather than hardcoding thresholds in Python — reuse that logic, don't reimplement it.

Implement this as a scheduled job (nightly batch, matching the retraining cadence in architecture
§5.2) with a manual/on-demand trigger hook that the forecasting-service client interface from Prompt
17 can call.
```

### Prompt 25 — Demand Forecasting Service (Prophet / XGBoost / LSTM)
```
Implement the champion/challenger forecasting pipeline from architecture §5.2 and masterplan §32:
Prophet as the default per-medicine, per-PHC daily consumption forecaster; XGBoost as a challenger
using the lag/footfall/disease-category/season features from Prompt 24, for series with enough
history; LSTM (PyTorch) reserved specifically for national/state aggregate series — bed demand and
oxygen demand — where sequence depth and multivariate inputs justify it, not for per-PHC-medicine
series. For each series, backtest both applicable candidates and pick whichever backtests better
rather than forcing one model everywhere.

Cover every forecast target masterplan §32 names: medicine demand, bed demand, oxygen demand, staff
requirement, patient footfall, resource shortage. Write results into forecast_predictions (Dataset 20)
with every Forecast Output Contract field (masterplan §33) populated: phc_id, district_id, medicine_id,
forecast_type, forecast_date, horizon_days, predicted_value, confidence_lower, confidence_upper,
model_used, model_version, generated_at — respecting the UNIQUE(phc_id, medicine_id, forecast_date,
forecast_type, model_used) constraint so reruns upsert cleanly. Emit the forecast.generated event
already in the Prompt 14 catalog on completion. Run nightly, per the retraining cadence in architecture
§5.2 — this pipeline is entirely offline/batch relative to the transactional path; never let it block
a PHC checkout (masterplan §88: "a PHC worker should never wait for an ML model to complete a
transaction").
```

### Prompt 26 — Statistical Anomaly / Early-Warning Detection
```
Implement the statistical/anomaly class of alert from masterplan §34, distinct from the deterministic
threshold alerts Prompt 13 above already handles directly off raw event data. Consuming
consumption_daily and patient_footfall, run a rolling z-score/EWMA against each PHC's own trailing
baseline (architecture §5.3) — e.g., footfall 3σ above its trailing 14-day mean. Before escalating any
single-PHC anomaly, cross-check neighboring PHCs' signals in the same district and require
corroboration (or an explicitly elevated severity for an isolated single-facility spike) — masterplan
and architecture both call this out to avoid declaring a regional event from one noisy facility.

Cover the anomaly classes masterplan §31/§34 name: sudden surge, persistent increase, regional
cluster, abnormal consumption correlation, unusual medicine usage, regional patient surge. Emit
results as anomaly-alert events into the same pipeline Prompt 13's alerts module already consumes —
do not write to the alerts table directly from here; let Prompt 13's module remain the single writer.
```

### Prompt 27 — Full Risk Scoring Engine
```
Prompt 13 above ships a basic risk score (shortage risk + consumption acceleration + emergency
severity) as a placeholder. Replace it here with the complete weighted formula masterplan §35
specifies: current shortage risk + forecast risk (from Prompt 25) + consumption acceleration +
supply-chain risk + emergency severity + regional risk, mapped to LOW/MODERATE/HIGH/CRITICAL. Read the
weights from system_config exactly as Prompt 16 already exposes them — never hardcode production
weights, so a governance admin changing a weight in Settings takes effect without a redeploy. Publish
updated scores as events for the alerts module and the gis_facility_risk materialized view to refresh
from, rather than writing to either directly.
```

### Prompt 28 — Cross-District Redistribution Optimizer (MILP)
```
Implement the transportation-problem-with-urgency-weighting optimizer from architecture §5.4 (OR-Tools
CP-SAT or PuLP+CBC): decision variables x[i][j] (quantity moved from surplus node i to deficit node
j), objective minimize (distance[i][j] * x[i][j]) − λ * (urgency[j] * fulfilled[j]), λ tuned so
urgency dominates cost for critical-priority requests. Enforce every constraint architecture §5.4
specifies: a source can't ship more than its own surplus, demand fulfilled is at least min(deficit,
available_supply), any batch whose expiry_date minus now is less than transit time is excluded as a
source, and critical-priority requests may only source within that tier's transit-time/distance
ceiling. Pull deficits/surpluses from Prompt 25's forecasts and current stock, and safety
buffers/max-distance config from system_config exactly as Prompt 16 exposes them.

Write output as a ranked list into redistribution_transfers with recommended_by='ai' and
status='recommended' only — approval remains exclusively the Governance Portal's officer-driven
workflow (masterplan §37). Populate source_phc_id, dest_phc_id, item_ref/item_type, quantity, and a
notes field carrying the optimizer's reasoning (distance, urgency, expected benefit) per masterplan
§36's required output fields, so the Governance Portal's recommendation card and Prompt 30's Copilot
explainability mode both have something concrete to surface.
```

### Prompt 29 — Crisis What-If Simulator Engine
```
Implement the real simulation pipeline behind the `/api/v1/governance/simulator/session` WebSocket
endpoint Prompt 17(c) already scaffolded, per architecture §5.5: apply the incoming scenario deltas
(footfall_delta%, supply_delta%, affected_districts[], duration_days) to the current forecast
baseline, re-run Prompt 25's demand forecast with the footfall multiplier as a covariate, re-run
Prompt 28's optimizer against the adjusted deficit/surplus map, and return additional_beds_needed,
additional_oxygen_needed, additional_medicine_by_type, additional_staff_needed, and
most_affected_districts, matching masterplan §41's exact output shape. Deterministic mode is the
default (masterplan §42); implement Monte Carlo as an explicit opt-in that runs the same three-step
pipeline N times with sampled variation and returns P50/P90 bands — never silently blend the two
modes. Use already-trained Prompt 25 models with scenario-adjusted inputs rather than retraining from
scratch per call, so this stays within interactive WebSocket latency.
```

### Prompt 30 — Governance AI Copilot (RAG)
```
Implement the real retrieval-augmented pipeline behind Prompt 17(d)'s scoped-retrieval endpoint, per
architecture §5.6 and masterplan §43. Retrieval: maintain periodically-refreshed structured-DB
summaries as text snippets (e.g., "District X: 12 PHCs, 3 critical, medicine stock-out risk in 4
days"), plus indexed alert/recommendation records with their generating rationale (Prompt 26's anomaly
reasoning, Prompt 28's optimizer notes). Apply the caller's role-based row filtering *before*
retrieval, reusing the exact JWT-claims scoping Prompt 2 above already applies to every other query, so
a State Admin's Copilot session can never retrieve another state's raw data. For "why" questions ("why
is District A at risk", "why was this transfer recommended"), pass the actual feature values and
optimizer constraints that fired and prompt the model to explain them rather than free-generate.

Every response must populate the full Copilot Response Contract (masterplan §44): answer, supporting
data, source alert/recommendation ID, timestamp, model version, confidence/limitations — and for "why"
questions specifically: reason, current stock, consumption rate, forecast demand, projected stockout,
relevant threshold, recommendation logic. No unsupported claims — if retrieval returns nothing
relevant, say so rather than generating an ungrounded answer.
```

### Prompt 31 — BRICS Federated Learning Training Client & Coordinator
```
Prompt 18 above stubs the federated coordinator with a fixed 5-node simulated roster "rather than a
live cross-border Flower deployment... explicitly a Phase 5, architected-for-not-yet-live capability."
This prompt builds the real one — but per Sumaiya's own scope note on her BRICS portal chain, whether
this should become a working demonstration or stay architected-for-only is an open decision (masterplan
§94) that needs the team's confirmation before Prompt 33 activates it. Build it here regardless; gate
activation, not construction.

Pattern: Federated Averaging (FedAvg) via Flower, one client per participating nation (India, Brazil,
Russia, China, South Africa). Each national client trains locally against federation_training_features
and only that materialized view (already the only SELECT grant on the federated_learning_service role
from Prompt 18). Before any update leaves a country's process, add DP-SGD noise (clip_norm and
noise_multiplier, recorded per round) and apply secure aggregation so the coordinator only ever sees
the *sum* of client updates — give the federated client process no network egress path except for the
serialized, noised model artifact, so it is structurally incapable of transmitting a raw record.

Write every round to federation_rounds maintaining the hash chain (this_hash =
SHA256(id||round_id||status||previous_entry_hash), same pattern as the audit log). Write every
country's epsilon/delta spend to privacy_budget_ledger per round, respecting
CHECK(cumulative_epsilon <= budget_limit) as a hard stop — a country that would breach its budget this
round is excluded from that round's aggregation, never silently truncated. Register aggregated
artifacts in federation_model_versions through received → validated → active → deprecated. None of
these writes may change any field name or shape from what Sumaiya's BRICS chain already committed to
rendering — any field her mocked schema lacks is a cross-team contract change to flag (Prompt 33), not
a silent addition.
```

### Prompt 32 — Model Monitoring, Drift Detection & Retraining Pipeline
```
Implement masterplan §64's model-monitoring requirements across every model from Prompts 25, 27, 28,
and 31: track model version, training-dataset version, training timestamp, backtest metrics,
prediction distribution, and actual-vs-predicted deltas as ground truth arrives (e.g. a forecast's
predicted_value compared against the consumption that actually landed in consumption_daily). Implement
drift detection (a sustained predicted-vs-actual gap beyond configurable tolerance) that flags a model
version rather than silently degrading it. On a flagged model: fall back to the last known-good version
for serving, and route the flagged version through retraining → validation → (human) approval →
deployment before it serves again — never auto-deploy a retrained model without that approval step,
per masterplan §88: "Never deploy an AI model solely because it produces plausible-looking
predictions."

Expose this monitoring data through the GraphQL layer Prompt 15 above already implements, and confirm
the exact field names against Sumaiya's Model Lineage page (her Prompt 4) before finalizing.
```

### Prompt 33 — Contract Conformance Pass & Placeholder Swap-In
```
Do a field-by-field pass reconciling every output from Prompts 24–32 against the contracts already
fixed elsewhere in this chain and in the three frontend chains: forecast_predictions rows against the
Forecast Output Contract fields Arya's Prompt 8 (Governance Portal) renders; redistribution_transfers
rows against Arya's Prompt 10 and this chain's own Prompt 19 supply-chain trigger; the Copilot response
shape against Arya's Prompt 14; and every federated.* write against Sumaiya's mocked schema — closing
the same reconciliation loop her own Prompt 8 already asks this team to close, now from the AI-engine
side too.

Swap each of Prompt 17/18's placeholder implementations for the real one built in Prompts 25/28/29/30
behind the same interface — a configuration/endpoint change, not a contract change: point the nightly
forecasting batch at Prompt 25 instead of Prompt 10's moving-average placeholder; point the
redistribution-optimizer client at Prompt 28; point the simulator WebSocket handler at Prompt 29; point
the Copilot retrieval endpoint at Prompt 30. Leave Prompt 18's stub coordinator live for the BRICS
surface specifically until the masterplan §94 open decision is confirmed by the team — do not activate
Prompt 31 unilaterally.

Run Prompt 22's cross-team reconciliation pass again after each swap, since a real model returns edge
cases (empty confidence bands, a solver returning zero feasible transfers, a Copilot retrieval with no
matching context) that a placeholder never exercised — confirm each frontend's empty/error states
(their own final "polish" prompts) actually handle what the real AI engine can now return, not just
what the stub could. Log every field-shape mismatch as a tracked issue rather than quietly changing a
contract. Write a README in `ai/README.md` documenting every model's library/version, retraining
cadence, the DB roles/grants each subfolder needs, which of Prompts 25–32 are live vs. still
backtest-only, and the masterplan §94 open decision inherited from Sumaiya's chain — answered once,
visibly, rather than assumed differently by each team.
```
