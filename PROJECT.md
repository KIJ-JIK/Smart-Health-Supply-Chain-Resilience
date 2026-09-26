# Project: Smart Health Supply Chain Resilience

## Architecture
The Smart Health Supply Chain Resilience platform connects three operational tiers:
1. **Tier 1 (Peripheral / Local):** PHC Portal (`apps/phc-portal`) on port 5173. Provides primary health clinic operations including patient records, clinical alerts, and local medicine inventory. Operates with an offline-first synchronization engine communicating with Central Backend via `POST /sync/push` and `POST /sync/pull`.
2. **Tier 2 (Governance / Regional & National):** Governance Portal (`apps/governance-portal`) on port 3000. Provides district, state, and national operational visibility, resource allocations, inventory redistribution recommendations, and outbreak tracking. Communicates with Central Backend via Apollo Client GraphQL (`POST /graphql`) and REST endpoints.
3. **Tier 3 (Global / Cross-Border Intelligence):** BRICS Portal (`apps/brics-portal`) on port 3001. Provides federated learning coordination, cross-border supply chain resilience monitoring, country node tracking, and privacy budget governance. Communicates with Central Backend via GraphQL (`POST /graphql`).
4. **Central Backend & Persistence:** Central Backend (`services/backend/smart-health-platform/backend`) on port 8000 backed by PostgreSQL 16 on port 5432 (database `smarthealth`). AI Engine (`services/ai-engine`) on port 5000.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | PHC Live Backend Sync | Remove mockBackendServer, useLiveServer branch toggles, and fallback PIN authentication in phc-portal | M1 | Survey E1 |
| 2 | Governance Mock Removal | Remove mockLink and mockResolvers in governance-portal apolloClient; rewire 8 static pages to live GraphQL | M1 | Survey E1 |
| 3 | BRICS Mock Removal | Set VITE_USE_MOCK=false, remove SchemaLink and resilientFallbackLink in brics-portal, eliminate static imports | M1 | Survey E1 |
| 4 | Inventory Mutation Persistence | Fix syncService.ts handling for inventory_batch_create and inventory_batch_update (batch_no fallback to id) | M2 | Survey E2 |
| 5 | Live Dynamic Governance Overviews | Replace hardcoded stats in stateOverview and districtOverview with live dynamic SQL aggregates | M2 | Survey E2 |
| 6 | Resilient State/District Resolution | Enable slug and code resolution ('state-mh', 'dist-pune') alongside UUID matching in GraphQL server | M2 | Survey E2 |
| 7 | Redistribution REST & Event Pipeline | Mount /api/v1/governance/redistribution router and trigger supplyChainShipments on redistribution approval | M2 | Survey E2 |
| 8 | BRICS Schema Harmonization | Harmonize GraphQL schema and resolvers in backend with brics-portal queries (federatedRound, model versions, ledger) | M2 | Survey E2 |
| 9 | 10 Canonical States & DB Seeds | Ensure PostgreSQL smarthealth has all 10 canonical states, 50 districts, 120 PHCs, and initial federated rounds | M2 | Survey E2 |
| 10 | Cross-Portal Verification Suite | Implement automated verification script (Tiers 1-4) simulating the complete operational cycle, exiting with code 0 | M_E2E | Survey E3 |
| 11 | Dual-Path Code Synchronization | Sync code updates from Smart_governance to active Codex runtime path to keep live HMR servers updated | M3 | Survey E3 |
| 12 | Live Service Health & CORS Assurance | Ensure all services on ports 8000, 3000, 3001, 5173, and 5000 respond with HTTP 200 without CORS or GraphQL errors | M3 | Survey E3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Live Backend Connectivity & Mock Data Removal | Complete removal of mock fallbacks across phc-portal, governance-portal, and brics-portal | none | IN_PROGRESS |
| M2 | End-to-End Data Propagation Pipeline | Backend syncService fixes, dynamic GraphQL overviews, redistribution REST route, BRICS schema alignment, and canonical database seeds | M1 | DONE |
| M3 | Dual-Path Synchronization & Live Service Health | Active runtime path synchronization via robocopy and live health verification across all ports | M1, M2 | PLANNED |
| M_E2E | Automated Cross-Portal Verification Suite | Automated integration script executing PHC -> Governance -> BRICS cycle with pass/fail checks exiting with 0 | M1, M2 | PLANNED |
| M_FINAL | Final Acceptance, Adversarial Hardening & Audit | 100% E2E test pass, Tier 5 adversarial stress testing, and Forensic Integrity Audit | M1, M2, M3, M_E2E | PLANNED |

## Interface Contracts
### PHC Portal ↔ Central Backend
- **Endpoint:** `POST /sync/push`
- **Payload:** `{ device_id: string, mutations: Array<{ id, entity_type, change_type, payload, client_timestamp }> }`
- **Supported entity types:** `phc_facilities`, `inventory_batches` (create & update), `alerts`, `patient_footfall`, `staff_attendance`, `resource_requests`.
- **Response:** `{ success: boolean, processed_count: number, results: Array<{ mutation_id, status: 'applied'|'conflict', error_code? }> }`

### Governance Portal ↔ Central Backend
- **GraphQL Endpoint:** `POST /graphql`
- **Queries:** `nationalOverview`, `stateOverview(stateId: ID!)`, `districtOverview(districtId: ID!)`, `phcDetail(phcId: ID!)`, `medicineIntelligence`, `resourceIntelligence`, `workforceIntelligence`, `patientIntelligence`, `forecasts`, `redistributionRecommendations`, `supplyChainShipments`, `auditLog`.
- **REST Endpoints:**
  - `GET /api/v1/governance/redistribution/recommendations?district=...`
  - `POST /api/v1/governance/redistribution/:id/decision` with body `{ decision: 'approve'|'reject'|'modify', notes: string }`

### BRICS Portal ↔ Central Backend
- **GraphQL Endpoint:** `POST /graphql`
- **Queries:** `federatedNodes`, `federatedRounds(status: String)`, `federatedRound(id: ID!)`, `federatedModelVersions`, `privacyBudgetLedger`.
- **Mutations:**
  - `startFederatedRound(modelId: String, targetEpsilon: Float, minParticipatingNodes: Int)`
  - `aggregateRound(roundId: ID!)`

## Code Layout
- `apps/phc-portal/`: Peripheral health clinic portal (Vite + React + Dexie DB)
- `apps/governance-portal/`: National/State/District governance portal (Next.js 14 App Router + Apollo Client)
- `apps/brics-portal/`: BRICS federated intelligence portal (Vite + React + Apollo Client)
- `services/backend/smart-health-platform/backend/`:
  - `src/index.ts`: Express application entry point, CORS middleware, router mounting
  - `src/modules/governance/graphqlServer.ts`: Apollo GraphQL schema, typeDefs, resolvers
  - `src/modules/sync/syncService.ts`: Offline mutation processor and DB persistence
  - `src/modules/governance/governanceService.ts`: Governance business logic and eventBus publishing
  - `src/modules/supply_chain/supplyChainService.ts`: Inventory redistribution & shipment tracking
  - `tests/verify_cross_portal_integration.ts`: Automated integration verification runner (R3)
- Active Runtime Mirror Path: `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`
