# Original User Request

## Initial Request — 2026-09-26T12:41:37Z

Interconnect the PostgreSQL backend across the PHC Portal, National/Governance Portal, and BRICS Portal, eliminating all mock/in-memory data fallbacks so mutations flow seamlessly across tiers (PHC → District/State/National → BRICS) with full programmatic and live frontend verification.

Working directory: `C:\Users\anshv\OneDrive\Desktop\Smart_governance`
Integrity mode: development

## Requirements

### R1. Live Backend Connectivity & Removal of Mock Data
Connect all three portal applications (`apps/phc-portal`, `apps/governance-portal`, and `apps/brics-portal`) directly to the PostgreSQL database via the Express and GraphQL backend (`services/backend/smart-health-platform/backend`). Deactivate or remove all client-side mock fallback schemas and static fallback datasets across all three portals so that all rendered statistics, tables, and charts are sourced strictly from live database records.

### R2. End-to-End Data Propagation Pipeline
Ensure end-to-end multi-tier data propagation:
1. **PHC to Governance (National/State/District):** When inventory quantities (e.g., medicine stock), bed occupancy, or clinical incident alerts are submitted or updated in the PHC Portal, the changes must immediately reflect in the database and be visible on the Governance Portal across National Overview, State Overview, and District Overview.
2. **Governance to BRICS Portal:** When governance-level decisions (such as stock redistribution approvals, national capacity updates, or federated model training rounds) are performed in the Governance Portal, the corresponding federated metrics, nodes, and supply chain ledger entries must reflect dynamically in the BRICS Portal.

### R3. Automated Cross-Portal Verification Suite
Provide an automated integration verification script that executes real database operations simulating a complete operational cycle:
1. PHC entry of inventory or facility stats.
2. Assertion that Governance GraphQL/REST queries return the updated figures at District, State, and National levels.
3. Execution of a governance event or federated training round.
4. Assertion that BRICS queries return the updated federated intelligence.
The script must log each verification step with explicit pass/fail checks and exit with code 0 on complete success.

### R4. Dual-Path Synchronization & Live Service Health
Ensure that all code changes made in `Smart_governance` are synced to the active runtime path (`C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`), and that all active portal and backend services (ports 8000, 3000, 5173, and BRICS) are healthy, responding without GraphQL or CORS errors.

## Acceptance Criteria

### Live Backend & Dataset Integration
- [ ] No portal uses local mock data fallbacks when rendering facility, inventory, redistribution, or federated metrics.
- [ ] GraphQL client error links in `governance-portal` and `brics-portal` do not fall back to in-memory fake schemas.
- [ ] Database queries in `graphqlServer.ts` and Express routers operate cleanly against the PostgreSQL `smarthealth` database.

### Dynamic Propagation
- [ ] Submitting a medicine stock adjustment or bed count in the PHC portal updates PostgreSQL and reflects when querying the Governance overview.
- [ ] Updating a governance action (e.g., redistribution transfer status or alert) updates PostgreSQL and is visible in the BRICS portal federated/supply queries.
- [ ] District and State drill-down screens in the Governance portal reflect real facility counts matching the 10 states and canonical districts in the database.

### Automated & Live Verification
- [ ] A verification script runs end-to-end, testing the PHC → National → BRICS flow against the live backend, and exits with 0.
- [ ] Live HTTP/GraphQL endpoint checks confirm successful responses (HTTP 200 with non-empty payload) from ports 8000, 3000, and BRICS.

## Follow-up — 2026-09-26T14:27:08Z

Perform a comprehensive multi-portal operational audit and verification suite confirming that all newly implemented changes (Google Gemini Vision prescription scanner in the PHC Portal, Google Gemini multilateral threat intelligence in the BRICS Portal, All-India 36-state database registry & GIS in the Governance Portal, and live PostgreSQL backend synchronization) are interconnected, healthy, and communicating end-to-end without any mock fallbacks.

Working directory: `C:\Users\anshv\OneDrive\Desktop\Smart_governance`
Integrity mode: development

## Requirements

### R1. Live Backend & 4-Port Service Health Verification
Verify that all four system services are active, healthy, and responding without CORS or GraphQL errors:
- Central Backend (`http://localhost:8000/health`)
- Governance Command Portal (`http://localhost:3000`)
- BRICS Federated Governance Portal (`http://localhost:3001`)
- PHC Field Edge Portal (`http://localhost:5173`)

### R2. End-to-End Verification of New Google AI Features
Verify that all newly introduced Google AI services are connected and operational:
1. **Google AI Computer Vision:** Validate `POST /api/v1/ai/vision/extract-prescription` by verifying that sample prescriptions and blister packaging images return structured OCR data with live PostgreSQL inventory matching.
2. **Google AI Multilateral Intelligence:** Validate `POST /api/v1/brics/ai-briefing` across multiple languages (English, Hindi, Portuguese, Russian, Mandarin) by verifying that real-time database alerts and differential privacy metrics are synthesized into threat bulletins.
3. **All-India 36-State Registry:** Validate that PostgreSQL contains all 28 States and 8 Union Territories and that the Governance GIS and scope selectors dynamically recognize all canonical state UUIDs.

### R3. Multi-Tier Cross-Portal Data Propagation Verification
Execute an automated operational cycle confirming live cross-tier synchronization:
1. PHC facility mutation via `POST /sync/push` directly updates PostgreSQL.
2. Governance GraphQL queries (`phcDetail`, `districtOverview`, `nationalOverview`) immediately reflect the mutated counts.
3. Governance redistribution action (`decideRedistribution`) transitions state in PostgreSQL and dispatches `supplyChainShipments` visible in the BRICS logistics ledger.

## Acceptance Criteria

### Service & Backend Liveness
- [ ] All four ports (8000, 3000, 3001, 5173) respond with HTTP 200.
- [ ] No client-side mock fallback error links intercept GraphQL or REST traffic.

### New Features Verification
- [ ] The Google AI vision endpoint successfully returns extracted medicines, dosage, and stock status for both sample prescriptions and blister packs.
- [ ] The BRICS AI briefing endpoint returns localized briefings in English and Hindi reflecting live database outbreak alerts.
- [ ] All 36 States/UTs are confirmed in PostgreSQL and recognized in GIS extents.

### End-to-End Data Propagation
- [ ] An automated test script runs through the full PHC → Governance → BRICS cycle and exits with code 0.
- [ ] Dual-path sync to the runtime directory (`C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`) is 100% synchronized.
