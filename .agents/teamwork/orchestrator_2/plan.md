# Plan — Comprehensive Multi-Portal Operational Audit & Verification Suite

## Objective
Verify and validate that all newly implemented changes across the Smart Health platform (Google Gemini Vision prescription scanner in PHC Portal, Google Gemini Multilateral Intelligence in BRICS Portal, All-India 36-State Registry & GIS in Governance Portal, and live PostgreSQL backend synchronization) are interconnected, healthy, and communicating end-to-end with zero mock fallbacks.

## Phases

### Phase 1: Deep Technical Exploration (3 Parallel Explorers)
- **Explorer 1 (Port Health & Mock Elimination)**:
  - Verify 4-port service health (8000, 3000, 3001, 5173).
  - Inspect client-side mock fallback error links across `apps/phc-portal`, `apps/governance-portal`, and `apps/brics-portal`.
  - Check GraphQL client error links and ensure zero fallback to in-memory fake schemas.
- **Explorer 2 (Google AI Features & 36-State Registry & GIS)**:
  - Inspect `POST /api/v1/ai/vision/extract-prescription` endpoint, OCR extraction, and live PostgreSQL inventory matching.
  - Inspect `POST /api/v1/brics/ai-briefing` multilateral intelligence across languages (English, Hindi, Portuguese, Russian, Mandarin) using database alerts and DP metrics.
  - Inspect PostgreSQL database schema for 36 States/UTs (28 states + 8 UTs) and Governance GIS/scope selectors.
- **Explorer 3 (Verification Suite & Dual-Path Sync Status)**:
  - Inspect `services/backend/smart-health-platform/backend/tests/verify_cross_portal_integration.ts` coverage against R1, R2, R3.
  - Inspect dual-path mirror status against `C:\Users\anshv\Documents\Codex\2026-09-26\re\work\Smart-Health-Supply-Chain-Resilience`.
  - Identify missing test assertions or synchronization gaps.

### Phase 2: Verification Suite Execution & Synchronization
- Synthesize explorer findings.
- Dispatch Worker / Test Writer to augment `verify_cross_portal_integration.ts` if any of R1-R3 checks are missing, execute the test suite, verify exit code 0, and ensure 100% dual-path synchronization.

### Phase 3: Adversarial Review & Empirical Verification
- Dispatch 2 independent Reviewers to review correctness, complete coverage of requirements, and absence of mock fallbacks.
- Dispatch 2 Challengers to independently test endpoints and verify data propagation.

### Phase 4: Forensic Integrity Audit (MANDATORY GATE)
- Dispatch Forensic Auditor (`teamwork_preview_auditor`) to verify zero mock fallbacks, zero hardcoded test returns, authentic Google AI execution, and genuine DB persistence.
- Enforce binary veto.

### Phase 5: Synthesis, Handoff & Reporting
- Generate `GATE_STATUS.md` and `handoff.md`.
- Report completion to Sentinel with full evidence.
