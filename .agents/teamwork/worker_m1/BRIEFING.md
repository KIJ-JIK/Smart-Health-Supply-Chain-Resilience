# BRIEFING — 2026-09-26T13:04:00Z

## Mission
Eliminate all mock data, fake schemas, Apollo mock links, fallback mechanisms, static TS datasets, and in-memory mock states across apps/phc-portal, apps/governance-portal, and apps/brics-portal, connecting all frontends strictly to the live backend.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1
- Original parent: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Milestone: M1

## 🔒 Key Constraints
- Exclusive write ownership: apps/phc-portal/**, apps/governance-portal/**, apps/brics-portal/**
- Do NOT edit any files in services/backend/ or services/ai-engine/
- Integrity Mandate: Genuine implementations only; no dummy/facade implementations, no hardcoded test results, no fake schemas.

## Current Parent
- Conversation ID: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Updated: 2026-09-26T13:04:00Z

## Task Summary
- **What to build**:
  1. `apps/phc-portal`: Remove useLiveServer branching in `src/hooks/useSyncEngine.ts`; route executePush/executePull directly to live backend endpoints (/sync/push, /sync/pull). Eliminate mock server execution in `src/utils/mockBackend.ts`. Remove simulation controls in `src/modules/sync/SyncStatusView.tsx`. Remove FALLBACK_FACILITIES and offline PIN bypass in `src/services/phcBackendService.ts`. In `src/modules/inventory/InventoryView.tsx`, ensure `inventory_batch_update` sends `batch_no` and `inventory_batch_create` sends proper fields.
  2. `apps/governance-portal`: Remove mockResolvers and mockLink in `src/lib/apolloClient.ts`. Direct queries strictly to live GraphQL endpoint. In `src/app/governance/page.tsx`, remove hardcoded baseline KPIs, static sparklines, static meters, static district rows, and bind to real GraphQL query results. Replace imports of static `@/lib/*Data.ts` in static pages with live Apollo GraphQL queries or live API calls.
  3. `apps/brics-portal`: Set VITE_USE_MOCK=false in `.env`. Remove SchemaLink, mockLink, and resilientFallbackLink in `src/graphql/client.ts`. Use live Apollo HTTP link to http://localhost:8000/graphql. In `src/pages/NodesPage.tsx`, eliminate static imports of mockNodeHistories and COUNTRY_STATS; bind to GET_FEDERATED_NODES. Harmonize operations in `src/graphql/operations.ts` with backend schema (`privacyBudgetLedger`, `startFederatedRound`).
- **Success criteria**: All portals compile/build cleanly with zero TypeScript errors; no mock links/fake schemas; real live data binding.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: apps/phc-portal, apps/governance-portal, apps/brics-portal

## Key Decisions Made
- [Initial planning]: Work through the three portal applications sequentially: phc-portal, then governance-portal, then brics-portal, followed by typecheck/build verification.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None specified

## Artifact Index
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1\handoff.md — Final handoff report
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m1\progress.md — Progress heartbeat
