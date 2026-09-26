# Orchestrator Plan: Smart Health Supply Chain Resilience

## Objective
Interconnect the PostgreSQL backend across the PHC Portal, National/Governance Portal, and BRICS Portal, eliminating all mock/in-memory data fallbacks so mutations flow seamlessly across tiers (PHC → District/State/National → BRICS) with full programmatic and live frontend verification. Ensure dual-path synchronization with the active runtime path and complete service health across all ports.

## Phase Breakdown

### Phase 0: Survey & Investigation (3 Explorers in parallel)
- **Explorer 1 (Portal & Client Mock Investigation)**:
  - Focus: `apps/phc-portal`, `apps/governance-portal`, `apps/brics-portal`.
  - Locate all mock data fallbacks, fake schemas, GraphQL error link fallbacks, static JSON/TS arrays, in-memory state fallbacks.
  - Determine client-side data fetching mechanisms (Apollo, React Query, fetch) and live backend connectivity.
- **Explorer 2 (Backend Schemas, Database, & Propagation APIs)**:
  - Focus: `services/backend/smart-health-platform/backend`, `graphqlServer.ts`, Express routes, PostgreSQL schema & migrations/seeds (`smarthealth` database).
  - Map data propagation flow: PHC inventory/bed/incident updates -> PostgreSQL tables -> Governance queries (District/State/National) -> Governance actions -> BRICS federated metrics & ledger entries.
- **Explorer 3 (Runtime Environment, Active Sync Path, & Verification Infra)**:
  - Focus: Active runtime path `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`, ports 8000, 3000, 5173, and BRICS portal service, existing verification scripts, package scripts, docker/compose or PM2 setups.

### Phase 1: Synthesis & PROJECT.md
- Merge findings from the 3 Explorers into `PROJECT.md` § Feature Inventory & Architecture.
- Define explicit interface contracts, code layouts, and test requirements.
- Author `TEST_INFRA.md` for E2E testing track.

### Phase 2: Dual-Track Implementation & Testing
- **Implementation Track**:
  - **Milestone 1 (R1)**: Live Backend Connectivity & Removal of Mock Data.
  - **Milestone 2 (R2)**: End-to-End Data Propagation Pipeline (PHC -> Governance -> BRICS).
  - **Milestone 4 (R4)**: Dual-Path Synchronization & Live Service Health.
- **E2E Testing Track**:
  - **Milestone 3 (R3)**: Automated Cross-Portal Verification Suite (Tiers 1-4). Publish `TEST_READY.md`.

### Phase 3: Final Acceptance, Tier 5 Adversarial Hardening, & Audit
- Execute full E2E verification suite.
- Dispatch Challengers for Tier 5 adversarial stress testing.
- Dispatch Forensic Auditor for integrity verification (binary veto).
- Ensure Gate Result is PASS.

### Phase 4: Final Handover
- Verify all acceptance criteria.
- Produce comprehensive handoff report to Sentinel.
