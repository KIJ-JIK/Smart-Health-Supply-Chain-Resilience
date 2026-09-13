# SMART HEALTH & SUPPLY CHAIN RESILIENCE
### National-Scale Health Resilience & Supply Chain Platform
**Masterplan — Product, UX, Backend, Data, AI, Security, Integration & Deployment**

> **Document status:** Canonical team reference (converted from PDF). Last updated: 2026-09-12.

---

## 1. MASTER VISION
The platform is a national-scale, federated healthcare operations and supply-chain intelligence system
connecting:
PHC Portal → Central Backend → Data Platform → AI Intelligence → Governance Portal → Decision/
Allocation → PHC/Supply Chain → Outcome Feedback
The PHC Portal is responsible for capturing trusted ground-level information:
- Facility information
- Beds
- Oxygen
- Equipment
- Medicines
- Medicine dispensing/billing
- Staff
- Attendance
- Patient footfall
- Shortages
- Requests
- Emergencies
The backend converts these operational records into:
- Validated data
- Current resource status
- Trends
- Forecasts
- Risk scores
- Alerts
- Shortage predictions
- Redistribution recommendations
- Supply-chain intelligence

The Governance Portal converts that intelligence into decisions:
- Monitor
- Investigate
- Approve
- Reject
- Modify
- Allocate
- Redistribute
- Escalate
- Activate crisis mode
- Simulate scenarios
- Generate reports
This preserves the central product principle:
AI recommends. Authorized human officials decide.
The source specification explicitly defines this capture/intelligence/decision separation.
## 2. PLATFORM OBJECTIVES
2.1 Primary objectives
1. Create real-time visibility across PHCs.
2. Reduce medicine stockouts.
3. Reduce medicine wastage through FEFO.
4. Detect abnormal consumption.
5. Predict medicine demand.
6. Predict bed, oxygen and workforce requirements.
7. Detect patient surges.
8. Detect emerging district-level risks.
9. Identify resource surplus and deficit.
10. Recommend cross-district redistribution.
11. Track supply movement from source to PHC.
12. Provide authorities with a national command center.
13. Support emergency/pandemic response.
14. Provide explainable AI recommendations.
15. Maintain complete auditability.
16. Support offline PHC operation.
17. Preserve strict role and jurisdiction boundaries.
18. Eventually enable privacy-preserving BRICS federated learning.

## 3. HIGH-LEVEL PLATFORM STRUCTURE
┌──────────────────────────┐
│ PHC PORTAL │
│ │
│ Facilities │
│ Inventory │
│ Billing / Dispensing │
│ Beds │
│ Oxygen │
│ Equipment │
│ Staff │
│ Attendance │
│ Footfall │
│ Requests │
│ Emergency │
└────────────┬─────────────┘
│
Offline-first sync
│
▼
┌──────────────────────────┐
│ API GATEWAY │
│ Authentication │
│ Rate limiting │
│ Validation │
│ Device verification │
└────────────┬─────────────┘
│
▼
┌──────────────────────────┐
│ SYNC ENGINE │
│ Push / Pull │
│ Idempotency │
│ Conflict Resolution │
│ Delta Synchronization │
└────────────┬─────────────┘
│
▼
┌────────────────────────────────────────────┐
│ CORE PLATFORM │
│ │
│ Auth / RBAC │
│ Facility & Resource │
│ Inventory & Billing │
│ Workforce │

│ Footfall │
│ Requests & Alerts │
│ Supply Chain │
└────────────────────┬───────────────────────┘
│
Event Bus / Data
│
┌─────────────────┴──────────────────┐
│ │
▼ ▼
┌──────────────────┐ ┌──────────────────┐
│ TRANSACTIONAL DB │ │ TIME SERIES DB │
│ PostgreSQL │ │ TimescaleDB │
│ PostGIS │ │ Footfall │
│ │ │ Consumption │
└────────┬─────────┘ └────────┬─────────┘
│ │
└────────────────┬───────────────────┘
▼
┌──────────────────────────┐
│ AI PLATFORM │
│ │
│ Forecasting │
│ Anomaly Detection │
│ Risk Engine │
│ Redistribution Optimizer │
│ Crisis Simulator │
│ AI Copilot │
└────────────┬─────────────┘
│
▼
┌──────────────────────────┐
│ GOVERNANCE PORTAL │
│ │
│ Command Center │
│ GIS │
│ Medicine Intelligence │
│ Resources │
│ Workforce │
│ Patients │
│ Forecasts │
│ Early Warnings │
│ Redistribution │
│ Supply Chain │
│ Crisis Mode │
│ Simulator │
│ AI Copilot │
│ Reports │

└────────────┬─────────────┘
│
Human decision/action
│
▼
┌──────────────────────────┐
│ ACTION & FEEDBACK │
│ │
│ Approve │
│ Allocate │
│ Dispatch │
│ Deliver │
│ Monitor │
│ Measure outcome │
└────────────┬─────────────┘
│
▼
Feedback to AI
The underlying architecture in the supplied design follows this same pattern, including the API gateway,
sync service, domain modules, event bus, Redis, PostgreSQL/PostGIS, TimescaleDB, AI services and
governance UI.
4. PORTAL 1 — PHC PORTAL
4.1 Design objective
The PHC Portal must be:
- Extremely simple
- Mobile-first
- Low-bandwidth
- Offline-first
- Fast
- Error-resistant
- Usable on low-spec Android devices
- Understandable without AI/supply-chain expertise
The source architecture explicitly defines intermittent connectivity, low-spec devices, write-heavy workloads
and minimal user training as the PHC environment.

## 5. PHC PORTAL INFORMATION ARCHITECTURE
Primary navigation
PHC PORTAL
├── Dashboard
├── Facility
├── Inventory
│ ├── Current Stock
│ ├── Batches
│ ├── Expiry
│ ├── Consumption
│ └── Stock Movements
├── Billing / Dispensing
├── Beds
├── Oxygen
├── Equipment
├── Staff
│ └── Attendance
├── Patient Footfall
├── Requests
├── Alerts
├── Emergency
├── Sync Status
└── Profile / Settings
## 6. PHC DASHBOARD
The dashboard should answer:
What is my PHC status right now?
Display:
Beds
- Total
- Occupied
- Available
- Occupancy %

Oxygen
- Cylinders
- Concentrators
- Available
- Critical status
Staff
- Total
- Present
- Absent
- On leave
- Shortage indicator
Medicines
- Normal
- Warning
- Critical
- Near-expiry
Patients
- Today's OPD
- Emergency
- Admissions
- Referrals
Attention Required
Examples:
- 3 medicines below threshold
- Insulin stock critical
- Oxygen critical
- Equipment under maintenance
- 2 staff absent
- Emergency request pending
The supplied prototype establishes the principle of showing operational status first, exceptions second, and
actions third.

## 7. FACILITY MODULE
Data captured
Facility identity
- PHC ID
- Name
- Facility type
- District
- State
- Coordinates
- Address
- Contact information
- Operational status
Capacity
- Total beds
- Emergency beds
- Isolation beds
- Occupied beds
- Available beds
Clinical capabilities
- Available clinical facilities
- Emergency capability
- Relevant equipment
Equipment
For every equipment type:
- Equipment ID
- Equipment type
- Quantity
- Working quantity
- Non-working quantity
- Maintenance status
- Last service date
- Next service date

## 8. MEDICINE INVENTORY MODULE
This is one of the most important modules.
Medicine master
Each medicine contains:
- Medicine ID
- Name
- Category
- Unit
- Optional price
- Status
Batch record
Each batch contains:
- Batch ID
- Medicine ID
- Batch number
- Received quantity
- Remaining quantity
- Minimum threshold
- Expiry date
- Received date
The supplied architecture explicitly models medicines separately from inventory batches and uses the batch
as the FEFO unit.
## 9. INVENTORY OPERATIONS
Users should be able to:
Receive stock
Medicine
↓
Batch number
↓
Quantity
↓

Expiry
↓
Source
↓
Received date
↓
Confirm
Adjust stock
Only authorized PHC users should be able to perform operational stock adjustments.
Every adjustment must require:
- Reason
- Quantity
- User
- Timestamp
- Device
- Previous quantity
- New quantity
View stock
For each medicine:
Medicine
Current quantity
Minimum threshold
Days of estimated stock
Nearest expiry
Status
## 10. FEFO BILLING / DISPENSING ENGINE
This should be treated as a transactional inventory system, not simply a UI feature.
The billing workflow:
Patient / Walk-in
↓
Prescription / Medicine selection

↓
System checks available stock
↓
FEFO batch selection
↓
Calculate bill
↓
Confirm dispensing
↓
Atomic stock deduction
↓
Generate bill
↓
Create consumption event
↓
Recalculate threshold
↓
Potential alert
↓
Consumption analytics
↓
AI demand pipeline
The architecture specifies idempotency, database locking, FEFO ordering, batch-level deductions and
threshold events for this operation.
Critical implementation rule
The browser must never be the authoritative inventory ledger.
The PHC can optimistically display a deduction while offline, but the server becomes authoritative once the
transaction synchronizes.
This prevents double-selling stock when multiple devices operate against the same PHC.
## 11. MICRO-CONSUMPTION ANALYZER
Every completed dispensing transaction should generate:
billing.transaction_completed

The analytics layer consumes this event and records:
- Medicine
- Quantity
- PHC
- Batch
- Timestamp
- Staff
- Patient/walk-in reference
From this calculate:
- Daily consumption
- 7-day consumption
- 14-day consumption
- 30-day consumption
- Consumption velocity
- Consumption acceleration
- Current stock coverage
- Projected stockout date
The architecture specifies TimescaleDB for high-write consumption and continuous aggregates for daily
consumption analysis.
## 12. AUTOMATIC STOCK STATUS
Each medicine should have:
NORMAL
Stock > minimum threshold.
WARNING
Stock ≤ minimum threshold.
CRITICAL
Projected stockout within configured risk window.
EXPIRED
Expired stock exists.

NEAR EXPIRY
Expiry falls inside configured warning window.
The system should distinguish:
current threshold risk from predicted future stockout risk.
## 13. AUTOMATED REQUIREMENT REQUEST
When consumption velocity indicates future shortage:
Consumption history
+
Current stock
+
Forecast
+
Safety buffer
↓
Recommended quantity
↓
Draft requirement request
The PHC user can:
- Review
- Edit
- Submit
- Cancel
The request records whether it was:
- Manual
- Automatically drafted
- Triggered by threshold breach
- Triggered by forecast

## 14. BED MODULE
Capabilities:
- Total beds
- Occupied
- Available
- Emergency
- Isolation
- Utilization %
- Historical utilization
- Update timestamp
Every update creates an operational event.
The backend calculates:
available = total - occupied
occupancy_rate = occupied / total
Governance aggregates this by:
PHC
↓
District
↓
State
↓
National
## 15. OXYGEN MODULE
Track:
Cylinders
- Total
- Available
- In use
- Empty
- Critical

Concentrators
- Total
- Working
- Non-working
- Available
Additional operational fields
- Last update
- Consumption
- Estimated days remaining
- Critical threshold
This feeds:
- PHC dashboard
- Governance dashboard
- Forecasting
- Early warning
- Redistribution
## 16. EQUIPMENT MODULE
Track:
- Equipment type
- Quantity
- Working
- Non-working
- Maintenance
- Service history
The supplied data model explicitly includes equipment quantity, working quantity and maintenance status.
## 17. STAFF MODULE
Staff registry:
- Staff ID
- Name
- Role
- PHC
- Active/inactive

Roles include:
- Doctor
- Nurse
- Pharmacist
- Technician
- Other
Attendance:
- Present
- Absent
- Leave
Governance derives:
- Staff availability
- Staff shortage
- Staff utilization
- District comparison
- Emergency staffing requirement
## 18. PATIENT FOOTFALL MODULE
Daily capture:
- OPD
- Emergency
- Admission
- Referral
Disease/category:
- Category
- Count
Historical views:
- Daily
- Weekly
- Monthly
The system must store these as append-only time-series records rather than repeatedly overwriting
historical counts.

## 19. REQUESTS MODULE
Request types:
Medicine
Oxygen
Bed
Staff
Equipment
Priority:
Routine
Urgent
Critical
Source:
Manual
Auto-draft
Threshold breach
Lifecycle:
Pending
↓
Approved
↓
Dispatched
↓
In Transit
↓
Delivered
or:
Pending → Rejected
The source API contract explicitly defines these request types, priorities and request reasons.

## 20. EMERGENCY MODULE
PHC staff can submit:
- Emergency type
- Severity
- Description
- Required resources
- Affected patients, where applicable
- Timestamp
Severity:
LOW
MEDIUM
HIGH
CRITICAL
Critical emergency events immediately enter the central alert pipeline.
## 21. OFFLINE-FIRST ARCHITECTURE
The PHC application should be a:
React + Vite + TypeScript PWA
with:
- Service Worker
- Workbox
- IndexedDB
- Dexie.js
- React Query
- Zustand
The local database contains:
- Facility data
- Inventory
- Beds
- Oxygen
- Staff
- Footfall

- Requests
- Alerts
- Pending mutations
The architecture explicitly defines IndexedDB as the local source of truth for PHC operational state while
offline.
## 22. SYNC ENGINE
Two primary operations:
POST /sync/push
GET /sync/pull
Push:
PHC device
↓
Pending mutations
↓
API gateway
↓
Validation
↓
Authorization
↓
Idempotency
↓
Domain processing
↓
server_seq
↓
Acknowledgement
Pull:
Server
↓
Changes since watermark
↓
PHC
↓

IndexedDB
↓
UI reconciliation
The architecture specifies a server sequence watermark and idempotent mutation handling for this
process.
## 23. CONFLICT RESOLUTION
Append-only events
Examples:
- Billing
- Dispensing
- Footfall
Use UUIDs.
No last-write-wins is required.
Mutable resources
Examples:
- Bed capacity
- Oxygen availability
Use server-authoritative reconciliation.
Stock conflicts
The server is authoritative.
If two offline devices attempt to consume the same stock:
Device A → accepted
Device B → conflict
Device B enters:
CONFLICT

and the PHC user receives a reconciliation task.
Duplicate request
The mutation UUID is the idempotency key.
Retrying the same mutation must never create a duplicate transaction.
## 24. GOVERNANCE PORTAL
The Governance Portal is the decision-making layer.
Primary navigation:
Governance Portal
├── National Command Center
├── GIS Health Map
├── Medicine Intelligence
├── Resources
├── Workforce
├── Patient Intelligence
├── AI Forecasts
├── Early Warnings
├── Redistribution
├── Supply Chain
├── Emergency / Pandemic Mode
├── Crisis Simulator
├── AI Copilot
├── Analytics & Reports
├── Audit
└── Administration
The source specification defines these major governance functions and the national/state/district drill-down
model.
## 25. NATIONAL COMMAND CENTER
Top KPIs:
- Total PHCs

- Active PHCs
- Critical PHCs
- Medicine alerts
- Bed utilization
- Oxygen status
- Staff availability
- Patient load
- Open emergencies
- Pending requests
The dashboard must answer four questions immediately:
1. What is happening?
2. Where is it happening?
3. What will happen next?
4. What should we do?
This is directly aligned with the supplied governance UI specification.
## 26. GOVERNANCE DRILL-DOWN
The navigation hierarchy:
National
↓
State
↓
District
↓
PHC
↓
Individual resource
↓
Transaction / event
Every drill-down must preserve the user's authorization scope.
For example:
State Admin
→ Own State
→ District

→ PHCs
→ Resources
A State Admin must never retrieve another state's data through a manipulated URL or API request.
## 27. GIS HEALTH INTELLIGENCE
Use:
- PostGIS
- MapLibre
- Deck.gl
- Redis geo caching
Map layers:
PHC layer
Each PHC is represented geographically.
Risk layer
Risk score determines visualization.
Medicine layer
Shortage/stockout risk.
Bed layer
Occupancy/availability.
Oxygen layer
Criticality.
Workforce layer
Staff shortage.
Emergency layer
Active emergencies.

Supply chain layer
Shipment routes.
## 28. MEDICINE INTELLIGENCE
Governance users can view:
- Current national stock
- State stock
- District stock
- PHC stock
- Current shortage
- Projected shortage
- Days remaining
- Consumption trend
- Expiry
- Wastage
- Stock movements
The supplied specification explicitly requires current shortage detection, stockout prediction, demand
forecasting and expiry/wastage analytics.
## 29. RESOURCE INTELLIGENCE
For beds:
- Total
- Occupied
- Available
- Utilization
- Forecast
For oxygen:
- Total
- Available
- Consumption
- Forecast
- Risk
For equipment:
- Available

- Working
- Maintenance
- Deficit
The system should calculate:
SURPLUS
BALANCED
DEFICIT
CRITICAL DEFICIT
## 30. WORKFORCE INTELLIGENCE
Show:
- Total staff
- Present
- Absent
- Leave
- Vacancy/shortage
- Staff-to-demand relationship
Analytics:
- District comparison
- Role comparison
- Staff shortage
- Emergency requirement prediction
## 31. PATIENT INTELLIGENCE
Display:
- OPD trend
- Emergency trend
- Admissions
- Referrals
- Disease-category trend
Detect:
- Sudden surge

- Persistent increase
- Regional cluster
- Abnormal consumption correlation
The platform should avoid declaring an outbreak solely from one anomalous PHC. The architecture
proposes cross-checking neighboring PHCs to reduce false positives.
## 32. AI FORECASTING ENGINE
Forecasting targets:
1. Medicine demand
2. Bed demand
3. Oxygen demand
4. Staff requirement
5. Patient footfall
6. Resource shortage
Recommended model hierarchy from the architecture:
Medicine / PHC series
Prophet as default.
Sufficient-data series
XGBoost challenger with:
- 7-day lags
- 14-day lags
- 30-day lags
- Rolling consumption
- Footfall
- Disease categories
- Seasonality
Larger aggregate series
LSTM can be reserved for national/state-level bed and oxygen demand where sequence depth and data
volume justify it.
The source architecture specifically proposes this champion/challenger approach rather than forcing one
model everywhere.

## 33. FORECAST OUTPUT CONTRACT
Every forecast should contain:
entity
metric
forecast_start
forecast_end
predicted_value
lower_bound
upper_bound
model_version
training_window
generated_at
confidence/quality metric
Example:
Medicine: Insulin
PHC: XYZ
Current stock: 180
Forecast demand: 500
Predicted stockout: 4 days
Risk: CRITICAL
Model: XGBoost
Model version: v1.4
## 34. EARLY WARNING ENGINE
Two classes:
Immediate deterministic alerts
Examples:
- Stock below threshold
- Bed occupancy above threshold
- Oxygen below threshold

Statistical/anomaly alerts
Examples:
- Consumption spike
- Patient-footfall spike
- Unusual medicine usage
- Regional patient surge
The supplied architecture explicitly separates threshold-based immediate warnings from statistical anomaly
detection.
## 35. RISK ENGINE
Every important resource should have a risk score.
Example conceptual model:
Risk =
Current shortage risk
+ Forecast risk
+ Consumption acceleration
+ Supply-chain risk
+ Emergency severity
+ Regional risk
Risk categories:
LOW
MODERATE
HIGH
CRITICAL
The exact production weights should be configurable rather than hardcoded.
## 36. REDISTRIBUTION ENGINE
Input:

Demanding PHCs
+
Surplus PHCs
+
Available stock
+
Forecast
+
Urgency
+
Distance
+
Transit time
+
Expiry
Output:
Source
Destination
Medicine/resource
Quantity
Urgency
Expected benefit
Distance
Transit time
Reason
The supplied architecture models redistribution as a transportation optimization problem and uses
urgency-weighted optimization with expiry and transit constraints.
## 37. REDISTRIBUTION WORKFLOW
AI detects deficit
↓
Find surplus nodes
↓
Apply safety buffers
↓
Check expiry
↓
Check transit time

↓
Calculate transportation options
↓
Optimization
↓
Rank recommendations
↓
Governance officer reviews
↓
Approve / Reject / Modify
↓
Create transfer
↓
Dispatch
↓
In transit
↓
Delivered
↓
Destination inventory updated
↓
Outcome recorded
The human approval step is mandatory for governance actions.
## 38. SUPPLY CHAIN INTELLIGENCE
Full chain:
Manufacturer
↓
Warehouse
↓
State
↓
District
↓
PHC
Track:
- Shipment
- Quantity
- Item

- Source
- Destination
- Dispatch time
- Expected delivery
- Actual delivery
- Status
- Delay
- Bottleneck
Analytics:
- Supplier performance
- Average transit time
- Delay frequency
- Emergency routing
- Failure points
## 39. EMERGENCY / PANDEMIC MODE
When activated:
NORMAL MODE
↓
CRISIS MODE
The interface changes to prioritize:
- Critical districts
- Active emergencies
- Resource deficits
- Medicine requirements
- Bed capacity
- Oxygen
- Staff
- Supply movements
- Recommended actions
The source feature specification defines crisis mode, emergency resource monitoring, high-risk districts and
emergency allocation.

## 40. CRISIS DETECTION FLOW
Patient surge
Disease signal
Stock anomaly
Emergency report
↓
Risk assessment
↓
District impact
↓
Forecast
↓
Resource requirements
↓
Optimization
↓
Emergency allocation
↓
Monitoring
## 41. CRISIS SIMULATOR
Scenario parameters:
Patient demand
- +30%
- +50%
- Custom %
Supply reduction
- -30%
- Custom %
District disruption
- Select district
- Duration
Outbreak
- Select cluster

- Severity
- Duration
Oxygen surge
- Demand multiplier
The simulator returns:
- Additional beds
- Additional oxygen
- Additional medicines
- Additional staff
- Most affected districts
- Projected shortages
The source specification explicitly lists these scenario classes and outputs.
## 42. SIMULATION ARCHITECTURE
Default:
Deterministic simulation
Optional:
Monte Carlo simulation
Pipeline:
Current baseline
↓
Apply scenario
↓
Adjust forecast
↓
Calculate deficits
↓
Run optimizer
↓
Calculate affected regions
↓
Return results

Monte Carlo output:
P50
P90
Risk interval
This follows the supplied architecture's deterministic-first design.
## 43. GOVERNANCE AI COPILOT
The Copilot must not be a generic chatbot with unrestricted database access.
It should use:
User
↓
Authorization
↓
Role-scoped retrieval
↓
Relevant structured data
↓
Alerts / forecasts / recommendations
↓
LLM
↓
Grounded response
Questions:
- "Why is District A at risk?"
- "Why did the system issue this alert?"
- "Why is this transfer recommended?"
- "Which districts are likely to face insulin shortages?"
- "What happens if patient load rises 30%?"
The architecture specifically requires role filtering before retrieval and grounding explanations in actual
feature values and optimizer constraints.

## 44. COPILOT RESPONSE CONTRACT
Every answer should ideally expose:
Answer
↓
Supporting data
↓
Alert/recommendation ID
↓
Timestamp
↓
Model version
↓
Confidence/limitations
For a "why" question:
Reason
Current stock
Consumption rate
Forecast demand
Projected stockout
Relevant threshold
Recommendation logic
No unsupported claims.
## 45. ANALYTICS & REPORTING
Reports:
National
- National resource status
- Medicine stock
- Shortages
- Forecasts
- Emergencies

State
- State performance
- District comparison
- Resource utilization
- Supply chain
District
- PHC comparison
- Shortages
- Requests
- Redistribution
PHC
- Inventory
- Billing
- Consumption
- Footfall
- Staff
- Resources
Exports:
- PDF
- CSV
- Excel where required
Generated reports should be stored in object storage.
## 46. BACKEND ARCHITECTURE
Phase 1–2
Use:
Modular Monolith
with strict domain boundaries.
Modules:
Auth
Facilities

Inventory
Billing
Resources
Workforce
Footfall
Requests
Alerts
Supply Chain
Audit
Analytics
The source architecture explicitly recommends a modular monolith for the first phases rather than
prematurely creating a full microservice mesh.
## 47. EVENT-DRIVEN INTERNAL ARCHITECTURE
Use an event bus such as:
- Kafka
- RabbitMQ
Example:
billing.transaction_completed
stock.threshold_breached
request.created
request.approved
redistribution.approved
shipment.dispatched
shipment.delivered
footfall.updated
staff.shortage_detected
emergency.created
forecast.generated
alert.created
Domain modules should communicate through events rather than directly sharing database tables.

## 48. DATABASE ARCHITECTURE
PostgreSQL + PostGIS
Use for:
- Facilities
- Equipment
- Medicines
- Inventory
- Billing
- Staff
- Requests
- Alerts
- Transfers
- Geographic entities
TimescaleDB
Use for:
- Patient footfall
- Medicine consumption
- Resource telemetry
- Forecasting input
Object Storage
Use for:
- Reports
- Exports
- Generated artifacts
- Model artifacts where appropriate
This division is directly specified in the architecture document.
## 49. CORE DATA ENTITIES
Minimum entity graph:
Country
↓

State
↓
District
↓
PHC
├── Equipment
├── Staff
│ └── Attendance
├── Inventory
│ └── Batch
├── Billing
│ └── Dispensed Item
├── Beds
├── Oxygen
├── Footfall
├── Requests
├── Emergencies
└── Alerts
Medicine
↓
Inventory Batch
↓
Dispensing
↓
Consumption
↓
Forecast
↓
Risk
↓
Recommendation
↓
Redistribution
## 50. API ARCHITECTURE
Use three communication patterns.
REST/OpenAPI
For PHC transactional writes:
- Inventory

- Billing
- Footfall
- Requests
- Facility updates
- Staff attendance
GraphQL
For governance read-heavy dashboards and drill-down.
SSE
For:
- Alerts
- KPI updates
- Real-time status
WebSocket
For:
- Crisis simulator
- Copilot streaming
This exact API division is specified in the architecture document.
## 51. API VERSIONING
Use:
/api/v1/
All APIs must have:
- OpenAPI documentation
- Request validation
- Response schemas
- Error codes
- Authentication
- Authorization
- Rate limiting
- Idempotency where necessary

- Correlation ID
## 52. IMPORTANT ENDPOINT GROUPS
/auth/*
/sync/*
/phc/{phcId}/facility/*
/phc/{phcId}/inventory/*
/phc/{phcId}/billing/*
/phc/{phcId}/beds/*
/phc/{phcId}/oxygen/*
/phc/{phcId}/equipment/*
/phc/{phcId}/staff/*
/phc/{phcId}/footfall/*
/phc/{phcId}/requests/*
/phc/{phcId}/emergency/*
/governance/dashboard/*
/governance/gis/*
/governance/medicine/*
/governance/resources/*
/governance/workforce/*
/governance/patients/*
/governance/forecasts/*
/governance/alerts/*
/governance/redistribution/*
/governance/supply-chain/*
/governance/crisis/*
/governance/copilot/*
/governance/reports/*
/audit/*
## 53. AUTHENTICATION
Use:
OAuth2/OIDC
with:
- Short-lived JWT

- Refresh token
- Device binding for PHC devices
The supplied architecture proposes OAuth2/OIDC, approximately 15-minute access tokens and device
certificates for PHC write access.
## 54. RBAC
National Admin
Can:
- View all data
- National analytics
- National redistribution
- Crisis decisions
- National configuration
State Admin
Can:
- View own state
- Compare districts
- State-level allocation
- State analytics
District Admin
Can:
- View district PHCs
- Manage local shortages
- Cross-PHC redistribution
PHC User
Can:
- View own PHC
- Update operational data
- Submit requests
- Submit emergencies
- View own request status

These roles and scopes are directly defined in the supplied specification.
## 55. DATABASE-LEVEL SECURITY
Authorization must not exist only in frontend or controller logic.
Use:
PostgreSQL Row-Level Security
Example:
National Admin
→ all rows
State Admin
→ own state
District Admin
→ own district
PHC User
→ own PHC
The supplied architecture explicitly requires RLS rather than relying solely on application-layer filtering.
## 56. AUDIT SYSTEM
Audit every important action:
- Login
- Data update
- Stock adjustment
- Billing
- Request creation
- Request approval
- Request rejection
- Redistribution approval
- Redistribution modification
- Crisis activation
- Crisis decisions

- Cross-tenant reads
- Configuration changes
Record:
Actor
Role
Action
Entity
Before
After
Timestamp
IP
Device
Correlation ID
AI recommendation
Decision
The supplied architecture requires an append-only audit mechanism for these governance-sensitive actions.
## 57. SECURITY ARCHITECTURE
At rest
- AES-256
In transit
- TLS 1.3
Identity
- OAuth2/OIDC
Authorization
- RBAC + RLS
PHC device
- Device binding/certificate

Patient information
Prefer facility-local pseudonymous references.
Governance analytics should remain aggregate wherever possible.
## 58. OBSERVABILITY
Every request should have:
request_id
correlation_id
user_id
device_id
phc_id
timestamp
service
operation
latency
status
Monitoring:
- API latency
- Error rate
- Sync failures
- Queue depth
- Event lag
- Database latency
- Forecast failures
- AI job failures
- Alert generation
- SSE connections
- WebSocket sessions
## 59. PHC SYNCHRONIZATION MONITORING
Governance should be able to see:
PHC
Last sync

Last successful sync
Pending mutations
Failed mutations
Conflict count
Offline duration
Device status
This is important because "real-time" national intelligence cannot mean data that is silently three days old.
The UI should explicitly label:
Last updated: X minutes ago
rather than pretending stale data is live.
## 60. DATA QUALITY ENGINE
Before data reaches analytics:
Required-field validation
Unit validation
Range validation
Examples:
occupied beds <= total beds
working equipment <= total equipment
remaining stock <= received stock
quantity > 0
expiry date valid
Duplicate detection
Timestamp validation
Device clock skew detection
Historical anomaly checks
The PHC workflow explicitly calls for required-field, unit, timestamp and duplicate validation.

## 61. MASTER EVENT FLOW
Example: Medicine Dispensed
PHC Worker
↓
Billing UI
↓
Local IndexedDB transaction
↓
Mutation Queue
↓
Sync
↓
API Gateway
↓
Authorization
↓
Idempotency check
↓
Inventory/Billing module
↓
FEFO allocation
↓
Database transaction
↓
Stock deduction
↓
Billing record
↓
Event Bus
├── Consumption Analyzer
├── Threshold Engine
├── Analytics
└── Audit
↓
AI pipeline
↓
Forecast
↓
Risk
↓
Alert / Recommendation
↓
Governance Portal

This is the core loop that should be demonstrated first.
## 62. MASTER REQUEST FLOW
PHC detects shortage
↓
Manual OR automatic draft
↓
Request created
↓
District Admin queue
↓
Validation
↓
Approve / Reject
↓
If approved
↓
Source allocation
↓
Dispatch
↓
Transit tracking
↓
Delivery
↓
Destination inventory update
↓
PHC receives confirmation
## 63. MASTER AI FLOW
Operational Data
↓
Validation
↓
Transactional DB / Time-series DB
↓
Feature Generation
↓
Forecasting

↓
Anomaly Detection
↓
Risk Scoring
↓
Surplus/Deficit Calculation
↓
Optimization
↓
Recommendation
↓
Human Approval
↓
Action
↓
Outcome
↓
Model Monitoring
This directly reflects the supplied end-to-end workflow from PHC data through validation, analytics,
forecasting, risk, optimization, governance action and feedback.
## 64. MODEL MONITORING
Every production model must have:
- Model version
- Training dataset version
- Training timestamp
- Metrics
- Backtest performance
- Prediction distribution
- Actual-vs-predicted monitoring
- Drift detection
If model performance degrades:
Production Model
↓
Drift detected
↓
Model flagged
↓
Fallback model

↓
Retraining
↓
Validation
↓
Approval
↓
Deployment
## 65. BRICS FEDERATED AI
This is an advanced phase.
Each participating country operates:
Local health data
↓
Local training
↓
Local model update
↓
Privacy protection
↓
Secure aggregation
↓
Federated coordinator
Countries:
- India
- Brazil
- Russia
- China
- South Africa
Raw records do not cross borders.
The supplied architecture specifies FedAvg/Flower, differential privacy and secure aggregation while
explicitly placing federation in Phase 5.

## 66. RECOMMENDED TECHNOLOGY STACK
PHC
- React
- Vite
- TypeScript
- PWA
- Workbox
- IndexedDB
- Dexie.js
- React Query
- Zustand
Governance
- Next.js
- TypeScript
- React
- Apollo Client
- Zustand
- MapLibre
- Deck.gl
Backend
Recommended:
- Node.js/TypeScript for core API
- Modular architecture
- REST/OpenAPI
- GraphQL
- SSE
- WebSocket
AI
- Python
- Prophet
- XGBoost
- PyTorch where required
- OR-Tools
- Flower

Data
- PostgreSQL
- PostGIS
- TimescaleDB
- Redis
- Object storage
Infrastructure
- Docker
- Kubernetes when scale requires it
- CI/CD
- Infrastructure as Code
The important point is to preserve the architectural boundaries rather than allowing technology choices to
collapse domains together.
## 67. REPOSITORY STRUCTURE
A monorepo is recommended initially.
smart-health-platform/
├── apps/
│ ├── phc-portal/
│ └── governance-portal/
│
├── backend/
│ ├── api/
│ ├── modules/
│ │ ├── auth/
│ │ ├── facilities/
│ │ ├── inventory/
│ │ ├── billing/
│ │ ├── resources/
│ │ ├── workforce/
│ │ ├── footfall/
│ │ ├── requests/
│ │ ├── alerts/
│ │ ├── supply-chain/
│ │ └── audit/
│ └── events/
│

├── ai/
│ ├── forecasting/
│ ├── anomaly/
│ ├── risk/
│ ├── optimizer/
│ ├── simulator/
│ ├── copilot/
│ └── federated/
│
├── packages/
│ ├── api-contracts/
│ ├── types/
│ ├── validation/
│ ├── auth/
│ └── ui/
│
├── database/
│ ├── migrations/
│ ├── seeds/
│ └── rls/
│
├── infrastructure/
│ ├── docker/
│ ├── kubernetes/
│ └── terraform/
│
└── docs/
├── architecture/
├── api/
├── security/
└── runbooks/
## 68. SINGLE SOURCE OF TRUTH
This is critical.
There should be:
One canonical backend representation of each operational entity.
For example:

Medicine Batch
↓
Inventory Batch Record
↓
Billing
↓
Consumption
↓
Forecast
↓
Governance
The Governance Portal must never maintain a separate manually updated copy of PHC inventory.
It always queries backend-derived data.
Similarly, PHC status must never be manually duplicated into governance.
## 69. CONFIGURATION MANAGEMENT
Thresholds should not be hardcoded.
Configurable:
- Minimum stock
- Critical stock
- Near-expiry period
- Bed occupancy threshold
- Oxygen critical threshold
- Footfall anomaly threshold
- Alert severity
- Forecast horizon
- Safety buffer
- Redistribution rules
Configuration should be versioned and audited.
PHC devices receive configuration through the sync mechanism.

## 70. FEATURE FLAGS
Use feature flags for:
- AI forecasting
- Crisis simulator
- Copilot
- Advanced redistribution
- New alert types
- BRICS federation
This permits controlled rollout.
## 71. TESTING MASTERPLAN
Unit tests
For:
- FEFO
- Stock deduction
- Threshold calculation
- Forecast calculations
- Risk calculations
- Optimization constraints
- Permissions
Integration tests
Test:
PHC
→ API
→ Database
→ Event Bus
→ AI
→ Governance

Critical security tests
Run the same query under:
- National Admin
- State Admin
- District Admin
- PHC User
and verify exact row visibility.
The architecture explicitly identifies this RLS integration test matrix as a high-leverage security investment.
## 72. OFFLINE TESTING
Simulate:
- No network
- 2G
- High latency
- Intermittent connectivity
- Network disconnect during billing
- Duplicate retry
- Device restart
- Multiple devices
- Conflict
- Clock skew
A PHC billing operation must never silently disappear.
## 73. AI TESTING
For every model:
- Backtesting
- Baseline comparison
- Error metrics
- Drift tests
- Missing-data tests
- Sparse-data tests
- Extreme-event tests
- Explainability tests

Never deploy an AI model solely because it produces plausible-looking predictions.
## 74. LOAD TESTING
Simulate:
1 PHC
10 PHCs
100 PHCs
1,000 PHCs
10,000 PHCs
National-scale deployment
Test:
- Concurrent billing
- Sync batches
- Dashboard queries
- GIS queries
- Alert streams
- Forecast jobs
- Redis
- Event bus
- Database
## 75. DISASTER RECOVERY
Must include:
- Automated DB backups
- Point-in-time recovery
- Object-storage replication
- Disaster recovery environment
- Backup validation
- Recovery runbook
Define:
RPO
and

RTO
as explicit project requirements before production.
## 76. DEPLOYMENT ARCHITECTURE
Recommended progression:
Prototype
Single environment
Docker Compose
PostgreSQL
Redis
Backend
PHC
Governance
AI
Pilot
Cloud
Managed PostgreSQL
Redis
Object storage
Containerized backend
Separate AI workers
Monitoring
National
Load Balancer
↓
API Gateway
↓
Multiple backend instances
↓
Event Bus
↓
Database cluster
↓
Read replicas

↓
Redis cluster
↓
AI workers
↓
Object storage
## 77. SCALING STRATEGY
Do not immediately create dozens of microservices.
Scale the bottleneck.
Likely extraction candidates:
1. Forecasting
2. Optimization
3. Federated learning
4. Copilot
The architecture explicitly identifies forecasting/optimization and federated learning as natural extraction
boundaries once workload patterns diverge.
## 78. IMPLEMENTATION PHASES
PHASE 0 — FOUNDATION
Deliver:
- Repository
- CI/CD
- Authentication
- RBAC
- Database
- RLS
- Facility hierarchy
- API contracts
- Design system
- Logging
- Monitoring foundation

79. PHASE 1 — PHC CORE
Build:
- PHC profile
- Facility
- Equipment
- Medicine master
- Inventory
- Batches
- Beds
- Oxygen
- Staff
- Attendance
- Footfall
- Requests
- Emergency
- Billing
- FEFO
- Stock deduction
- Offline mode
- Sync
This corresponds to the first implementation priority in the supplied feature specification.
80. PHASE 2 — GOVERNANCE VISIBILITY
Build:
- Command Center
- State view
- District view
- PHC drill-down
- GIS
- Medicine intelligence
- Resource monitoring
- Workforce
- Patient intelligence
- Basic alerts
The source plan identifies this as the second phase.

81. PHASE 3 — AI INTELLIGENCE
Build:
- Demand forecasting
- Stockout prediction
- Patient surge detection
- Abnormal consumption
- Risk scoring
- Surplus/deficit detection
- Early warning
This follows the supplied Phase 3 definition.
82. PHASE 4 — DECISION SUPPORT
Build:
- Redistribution optimizer
- Approval workflow
- Supply chain
- Shipment tracking
- Explainable recommendations
- Emergency allocation
- Crisis mode
This matches the supplied Phase 4 scope.
83. PHASE 5 — ADVANCED INTELLIGENCE
Build:
- Crisis simulator
- AI Copilot
- Model monitoring
- Federated learning
- Advanced intelligence
The supplied specification deliberately places these in Phase 5 rather than making them prerequisites for
the core system.

## 84. MVP DEFINITION
The MVP should prove one complete loop:
PHC
↓
Medicine received
↓
Medicine dispensed
↓
Billing generated
↓
Stock automatically deducted
↓
Consumption recorded
↓
Threshold crossed
↓
Alert generated
↓
Governance sees alert
↓
Forecast predicts shortage
↓
Surplus PHC identified
↓
Recommendation generated
↓
Officer approves
↓
Transfer created
↓
Shipment dispatched
↓
PHC receives stock
↓
Inventory updated
If this works reliably, the platform's fundamental value proposition is demonstrated.
## 85. ACCEPTANCE CRITERIA FOR THE CORE LOOP
The system should pass all of these:

PHC
- Can operate without internet.
- Can create billing transactions offline.
- Can queue mutations.
- Can synchronize when online.
Backend
- Never double-applies a transaction.
- Correctly applies FEFO.
- Correctly rejects insufficient stock.
- Correctly handles conflicts.
AI
- Receives actual consumption.
- Produces forecast.
- Produces risk.
Governance
- Sees updated inventory.
- Sees alert.
- Sees forecast.
- Sees recommendation.
Decision
- Officer can approve/reject/modify.
Supply chain
- Transfer becomes trackable.
Feedback
- Destination inventory reflects delivery.
## 86. END-TO-END DATA OWNERSHIP
Domain Owner
Facility Facility module
Inventory Inventory module
Billing Billing module

Domain Owner
Beds Resource module
Oxygen Resource module
Equipment Resource module
Staff Workforce module
Attendance Workforce module
Footfall Footfall module
Requests Requests module
Alerts Alert module
Forecast AI platform
Recommendation Optimization engine
Decision Governance
Transfer Supply chain
Audit Audit subsystem
No frontend owns authoritative business data.
## 87. NON-FUNCTIONAL REQUIREMENTS
PHC
- Offline capable
- Low bandwidth
- Fast startup
- Low memory
- Minimal interaction count
- Resilient synchronization
Governance
- Near-real-time
- High query performance
- Large-screen optimized
- GIS capable
- Drill-down capable

Backend
- Idempotent
- Secure
- Observable
- Horizontally scalable
AI
- Explainable
- Versioned
- Reproducible
- Monitored
- Decoupled from transactional writes
## 88. CRITICAL DESIGN PRINCIPLES
1. Server is authoritative
Especially for inventory.
2. Offline does not mean disconnected forever
The client queues changes safely.
3. Events drive intelligence
Operational transactions generate events.
4. AI never blocks operations
A PHC worker should never wait for an ML model to complete a transaction.
5. Human approves resource movement
AI recommends; governance decides.
6. Security is enforced at the database
Not just the frontend.
7. Historical records are immutable where possible
Especially dispensing and footfall events.

8. Every decision is auditable
Especially crisis and redistribution decisions.
9. Forecasts must show uncertainty
Do not present predictions as facts.
10. Federated AI comes later
First prove the single-country operational loop.
## 89. FINAL PLATFORM FLOW
GROUND REALITY
│
▼
┌─────────────┐
│ PHC PORTAL │
└──────┬──────┘
│
Offline / Online
│
▼
┌─────────────┐
│ SYNC LAYER │
└──────┬──────┘
│
▼
┌─────────────────┐
│ CORE BACKEND │
│ │
│ Facility │
│ Inventory │
│ Billing │
│ Resources │
│ Workforce │
│ Footfall │
│ Requests │
│ Alerts │
└────────┬────────┘
│
Events + Data
│
┌─────────┴─────────┐

▼ ▼
Transactional Time-series
Data Data
│ │
└─────────┬─────────┘
▼
┌───────────┐
│ AI LAYER │
├───────────┤
│ Forecast │
│ Anomaly │
│ Risk │
│ Optimize │
│ Simulate │
│ Copilot │
└─────┬─────┘
│
▼
┌─────────────────┐
│ GOVERNANCE │
│ PORTAL │
└────────┬────────┘
│
Human Decision
│
┌──────────────┼──────────────┐
▼ ▼ ▼
Approve Allocate Escalate
│ │ │
└──────────────┼──────────────┘
▼
ACTION LAYER
│
▼
PHC / SUPPLY
│
▼
OUTCOME
│
▼
FEEDBACK
│
▼
AI / DATA

## 90. SUCCESS METRICS
The production system should ultimately measure:
Supply chain
- Stockout frequency
- Stockout duration
- Emergency fulfillment time
- Redistribution fulfillment rate
- Delivery delay
Medicine
- Medicine wastage
- Near-expiry usage
- Expired inventory
- Forecast accuracy
- Consumption anomaly detection
Resources
- Bed utilization
- Oxygen availability
- Equipment availability
- Staff availability
Operations
- PHC reporting compliance
- Data freshness
- Sync success rate
- Conflict rate
AI
- Forecast error
- Alert precision
- False positive rate
- Recommendation acceptance rate
- Recommendation outcome
Governance
- Time-to-detection
- Time-to-decision
- Time-to-allocation
- Crisis response time

## 91. THE MOST IMPORTANT IMPLEMENTATION RULE
Do not build:
PHC frontend
+
Governance frontend
+
some APIs
as three disconnected projects.
Build:
ONE PLATFORM
│
├── PHC experience
├── Governance experience
├── Shared contracts
├── Shared identity
├── Shared backend
├── Shared data
├── Shared event model
├── Shared audit
└── Shared AI layer
Every feature must have a defined:
UI → API → authorization → domain logic → database → event → analytics/AI → governance →
action → feedback
path.
That is what will make the portals genuinely seamless rather than merely visually connected.
## 92. RECOMMENDED BUILD ORDER
The actual engineering sequence should be:

1. Domain model
2. Database
3. RLS/security
4. API contracts
5. Authentication
6. PHC offline shell
7. Sync engine
8. Facility/resource modules
9. Inventory
10. Billing + FEFO
11. Requests/emergency
12. Event bus
13. Governance read layer
14. Command center
## 15. GIS
16. Alerts
17. Analytics
18. Forecasting
19. Risk engine
20. Redistribution
21. Supply chain
22. Crisis mode
23. Simulator
24. Copilot
25. Federated AI
This order ensures that advanced AI is built on reliable operational data rather than attempting to
compensate for weak data capture.
## 93. FINAL PRODUCT ARCHITECTURE
The final system should be understood as five connected layers:
LAYER 1 — CAPTURE
PHC Portal
Captures what exists and what is needed.
LAYER 2 — TRUST
Backend + Validation + Sync + Security
Ensures the information is legitimate, synchronized and authorized.

LAYER 3 — INTELLIGENCE
Analytics + AI
Determines what is happening, what is likely to happen and where the risks are.
LAYER 4 — DECISION
Governance Portal
Allows authorities to understand, approve and act.
LAYER 5 — RESILIENCE
Supply Chain + Emergency + Crisis Simulation + Federated AI
Turns the platform from a monitoring system into a national resilience system.
The supplied product specification summarizes the same intended progression as:
real-time visibility → forecasting → early warning → redistribution → emergency resilience →
federated intelligence.
## 94. OPEN DECISIONS BEFORE WE LOCK THE
MASTERPLAN
I understand the product and architecture well enough to proceed, but there are a few implementation
decisions that the documents don't definitively specify. I would want these answered before turning
this masterplan into a final engineering specification:
1. Target country for the first deployment: Is the initial implementation specifically for India, or
should the data model be country-neutral from day one?
2. Patient records: Should the system actually maintain patient-level records/prescriptions, or should
the billing interface use only a minimal patient reference/walk-in identifier? The current architecture
intentionally minimizes patient-identifiable data.
3. Billing: Is this intended to be a genuine financial billing system with taxes/payment/refunds, or
primarily a medicine dispensing ledger that generates a bill/document for inventory tracking?
4. Supply-chain actors: Do you want actual manufacturer/warehouse/state/district logistics users to
have their own portal, or should supply-chain operations initially be handled through the
Governance Portal?

5. Notifications: Should alerts go only to the portals, or also through SMS/WhatsApp/email/push
notifications?
6. Government hierarchy: Should the hierarchy be strictly: National → State → District → PHC, or do
you need additional levels such as block/taluka/sub-district?
7. GIS: Do you expect real road-routing/travel-time calculations for redistribution, or is geographic
distance sufficient for the first version?
8. AI data availability: Do you already have historical medicine consumption, patient footfall, bed,
oxygen and staff datasets, or do we need to design a synthetic/demo dataset for the first
implementation?
9. Deployment: Is this intended to run on a government/private cloud, AWS/Azure/GCP, an on-premise
data center, or do you want the architecture cloud-neutral?
10. Scale: Do you have a target number of PHCs for the pilot and eventual national deployment?
11. Languages: Should the PHC portal support multiple Indian languages from the beginning?
12. Device strategy: Is the PHC portal strictly a browser/PWA, or do you eventually want Android/iOS
native applications?
13. Approval hierarchy: For example, can a District Admin approve every local redistribution, while
State/National approval is required above a quantity/value/risk threshold?
14. AI autonomy: I have assumed no autonomous resource movement—AI recommends, human
approves. Please confirm this is the intended governance rule.
15. BRICS: Should BRICS federation be merely architected for now, or do you need a working
demonstration for the final prototype?
These aren't blockers for the architectural masterplan, but they will materially affect the final database
schema, API contracts, screens, workflows and deployment architecture.
The two supplied documents already establish the core implementation sequence—core data capture →
governance → AI → decision support → advanced/federated capabilities—so I would keep that sequence
unless your answers above require a change.

---

## 95. DATA LAYER - 26 CANONICAL DATASETS

> **Added:** 2026-09-12 | This section was not in the original masterplan PDF.
> It specifies the complete data model that implements every module above.
> All schema files are in datasets/schemas/. Seed data is in datasets/seeds/output/.
> **Any schema change here must also update final_architecture.md Section 9.**

### Dataset Table

| # | Table / View | Layer | Store | Key Rule |
|---|---|---|---|---|
| 1 | states | Geography | PostgreSQL | Reference hierarchy root |
| 2 | districts | Geography | PostgreSQL | FK to states; JWT district_id |
| 3 | phc_facilities | Geography | PostgreSQL + PostGIS | Beds/oxygen as operational columns; GIST index |
| 4 | equipment | Geography | PostgreSQL | Per-PHC equipment inventory |
| 5 | medicines | Geography | PostgreSQL | Shared medicine master |
| 6 | inventory_batches | Geography | PostgreSQL | FEFO; UNIQUE(phc_id, medicine_id, batch_no) |
| 7 | staff_registry | PHC Ops | PostgreSQL | Staff master per PHC |
| 8 | staff_attendance | PHC Ops | PostgreSQL | UNIQUE(staff_id, attendance_date) |
| 9 | billing_transactions | PHC Ops | PostgreSQL | client_txn_id = idempotency key |
| 10 | dispensed_items | PHC Ops | PostgreSQL | FEFO line items per bill |
| 11 | resource_requests | PHC Ops | PostgreSQL | State machine: pending to approved to dispatched to delivered |
| 12 | mutation_queue | PHC Ops | PostgreSQL | Sync audit; UNIQUE(phc_id, device_id, local_seq) |
| 13 | patient_footfall | Time-Series | TimescaleDB | Hypertable; categories: opd/emergency/admission/referral |
| 14 | consumption_velocity | Time-Series | TimescaleDB | Hypertable; feeds forecasting + AI |
| 15 | consumption_daily | Time-Series | TimescaleDB | Continuous agg; DERIVED - no seed |
| 16 | alerts | Governance | PostgreSQL | Unified: stockout/bed/oxygen/outbreak/emergency |
| 17 | redistribution_transfers | Governance | PostgreSQL | AI-recommended (OR-Tools MILP); human approves |
| 18 | reconciliation_events | Governance | PostgreSQL | Saga state machine |
| 19 | audit_log | Governance | PostgreSQL | Append-only; hash-chained; no UPDATE/DELETE |
| 20 | forecast_predictions | Governance | PostgreSQL | Prophet/XGBoost/LSTM; uncertainty bands |
| 21 | system_config | Governance | PostgreSQL | Configurable thresholds; versioned |
| 22 | gis_facility_risk | Governance | PostgreSQL | Materialized view; DERIVED - no seed |
| 23 | federation_training_features | BRICS | PostgreSQL | Materialized view; stays in-country; DERIVED - no seed |
| 24 | federation_rounds | BRICS | PostgreSQL | Hash-chained; every round logged |
| 25 | privacy_budget_ledger | BRICS | PostgreSQL | CHECK(cumulative_epsilon <= budget_limit) |
| 26 | federation_model_versions | BRICS | PostgreSQL + S3 | activated_at NULL = not deployed |

### Key Non-Negotiable Rules

1. **FEFO is server-authoritative.** inventory_batches.remaining_qty is only updated by the server FEFO transaction. Client deduction is optimistic UI only.
2. **Idempotency.** billing_transactions.client_txn_id is UNIQUE. mutation_queue(phc_id, device_id, local_seq) is UNIQUE. Server upserts, never double-applies.
3. **RLS at the database.** Every PHC-linked table has PostgreSQL RLS policies using app.current_role, app.current_district_id, app.current_state_id session variables.
4. **Audit is immutable.** audit_log has CREATE RULE blocking UPDATE and DELETE at the database level.
5. **Privacy floor is structural.** privacy_budget_ledger has CHECK(cumulative_epsilon <= budget_limit) - the database rejects the insert if it would breach the agreed epsilon budget.
6. **AI recommends, human decides.** redistribution_transfers.recommended_by = 'ai' flags AI origin; status transitions to 'approved' require authenticated governor action.
7. **No raw data crosses the BRICS border.** federation_training_features never leaves the sovereign region. Only masked_weight_delta (opaque DP-noised bytes) is transmitted.
8. **Thresholds are configurable.** system_config table, not hardcoded. PHC devices receive config through the sync pull mechanism.

### Change Log

| Version | Date | Change |
|---|---|---|
| v1 | 2026-09-12 | Initial datasets (old architecture, ltree hierarchy, 25 datasets) |
| v2 | 2026-09-12 | Full rebuild aligned with final architecture and masterplan. 26 datasets. New: states, districts, equipment, staff_registry, dispensed_items, mutation_queue, system_config. Removed: outbox, bed_state, oxygen_state, jurisdiction_emergency_state, safety_stock_policy. Renamed: facilities to phc_facilities, medicine_batches to inventory_batches, bills to billing_transactions, supply_requests to resource_requests, redistribution_orders to redistribution_transfers, risk_alerts to alerts, footfall_counts to patient_footfall, inventory_deltas to consumption_velocity. |