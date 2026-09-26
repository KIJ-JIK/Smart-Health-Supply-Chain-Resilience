# BRIEFING — 2026-09-26T13:46:00Z

## Mission
Eliminate mock data fallbacks, fake schemas, and static data imports across apps/governance-portal and apps/brics-portal, direct all GraphQL queries strictly to the live backend, and verify typecheck passes.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1_gen2
- Original parent: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Milestone: M1

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP: apps/governance-portal/**, apps/brics-portal/**, apps/phc-portal/**
- Do NOT modify files in services/backend/
- Genuine implementation only: DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task
- No "while I'm here" refactoring
- No whole-file replacements for small edits; re-read before modifying
- Verify typecheck passes on both portals

## Current Parent
- Conversation ID: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Updated: 2026-09-26T13:46:00Z

## Task Summary
- **What to build**: Complete mock data removal and live GraphQL wiring for governance-portal and brics-portal.
- **Success criteria**:
  1. apps/governance-portal:
     - src/lib/apolloClient.ts: remove mockResolvers and mockLink; direct all GraphQL queries strictly to live backend.
     - src/app/governance/page.tsx: remove hardcoded baseline KPIs, sparklines, static meters, and static district table; bind directly to live GraphQL query results.
     - Static pages (medicine, resources, workforce, patients, forecasts, audit, analytics, gis): replace imports of static @/lib/*Data.ts with live Apollo GraphQL queries or live API calls.
  2. apps/brics-portal:
     - In .env: set VITE_USE_MOCK=false.
     - In src/graphql/client.ts: remove SchemaLink, mockLink, and resilientFallbackLink; use standard live Apollo HTTP link to http://localhost:8000/graphql.
     - In src/pages/NodesPage.tsx: eliminate static imports of mockNodeHistories and COUNTRY_STATS; bind to GET_FEDERATED_NODES query.
     - In src/graphql/operations.ts: harmonize query and mutation operations with backend schema (use privacyBudgetLedger, startFederatedRound).
  3. Verify typecheck passes on governance-portal and brics-portal.
- **Interface contracts**: PROJECT.md
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Initial setup and plan formulation.

## Artifact Index
- DISPATCH.md — Task assignment from parent
- ORIGINAL_REQUEST.md — Original user request
- PROJECT.md — Architecture and interface contracts
- progress.md — Liveness heartbeat and progress tracking
- handoff.md — Final handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Not run yet
- **Lint status**: Not run yet
- **Tests added/modified**: None yet

## Loaded Skills
- None
