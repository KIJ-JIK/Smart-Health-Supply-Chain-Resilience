# BRIEFING — 2026-09-26T18:26:00Z

## Mission
Investigate frontend portals (apps/phc-portal, apps/governance-portal, apps/brics-portal) for mock data fallbacks, fake schemas, GraphQL error link fallback mechanisms, static JSON/TS datasets, and in-memory mock states, and document an actionable strategy to remove all mocks and connect cleanly to live backend APIs.

## 🔒 My Identity
- Archetype: teamwork_preview_explorer
- Roles: Codebase & Portal Mock Investigator
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1
- Original parent: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Milestone: Survey & Mock Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce survey_report.md and handoff.md in C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1
- Maintain BRIEFING.md and progress.md with regular updates

## Current Parent
- Conversation ID: f5ad52ea-a48b-479e-b610-1bc7257fe19a
- Updated: 2026-09-26T18:26:00Z

## Investigation State
- **Explored paths**:
  - `apps/phc-portal`: `src/utils/mockBackend.ts`, `src/hooks/useSyncEngine.ts`, `src/modules/sync/SyncStatusView.tsx`, `src/services/phcBackendService.ts`, `src/db/seedData.ts`, `src/modules/beds`, `src/modules/inventory`, `src/modules/billing`, `src/modules/alerts`, `src/modules/oxygen`, `src/modules/emergency`
  - `apps/governance-portal`: `src/lib/apolloClient.ts`, `src/graphql/mockResolvers.ts`, `src/graphql/queries.ts`, `src/lib/*Data.ts` (12 files), `src/app/governance/page.tsx`, `src/app/medicine/page.tsx`, `src/app/resources/page.tsx`, `src/app/workforce/page.tsx`, `src/app/patients/page.tsx`, `src/app/forecasts/page.tsx`, `src/app/audit/page.tsx`, `src/app/analytics/page.tsx`, `src/app/supply-chain/page.tsx`, `src/app/redistribution/page.tsx`, `src/app/early-warnings/page.tsx`, `src/app/gis/page.tsx`, `src/store/*`
  - `apps/brics-portal`: `.env`, `src/graphql/client.ts`, `src/graphql/schema.ts`, `src/graphql/resolvers.ts`, `src/graphql/mock-data.ts`, `src/graphql/mock-node-details.ts`, `src/graphql/operations.ts`, `src/pages/*`
  - `services/backend`: `src/modules/governance/graphqlServer.ts`, `src/index.ts`, `src/modules/phc/phcPortalRoutes.ts`, `src/modules/sync/syncService.ts`, `src/modules/sync/syncController.ts`, `src/modules/federation/federationService.ts`, `database/seeds/full_seed.sql`
- **Key findings**:
  - Found extensive mock layers across all 3 portals:
    - `brics-portal`: `VITE_USE_MOCK=true` forces in-memory executable schema; `resilientFallbackLink` silently intercepts backend errors and falls back to mock resolvers; schema mismatches between backend `graphqlServer.ts` and `brics-portal` operations.
    - `governance-portal`: `apolloClient.ts` has `mockResolvers` and `mockLink`; 8 major pages bypass GraphQL entirely and read from static `@/lib/*Data.ts` files; `app/governance/page.tsx` has hardcoded baseline fallbacks, sparklines, meters, and district tables.
    - `phc-portal`: `mockBackend.ts` implements in-browser server; `useSyncEngine.ts` has `useLiveServer` branch; `SyncStatusView.tsx` has simulator toggle; `phcBackendService.ts` has offline fallback credentials and facilities.
- **Unexplored areas**: None. Full audit of all 3 portals and backend completed.

## Key Decisions Made
- Document every file path, line number, verbatim mock code snippet, and operational discrepancy in `survey_report.md`.
- Formulate a 5-component handoff report in `handoff.md` with explicit verification methods.

## Artifact Index
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\survey_report.md — Detailed survey report
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_1\handoff.md — 5-component handoff report
