# Progress Heartbeat — Worker M1

**Current Status**: Phase 1 Complete (apps/phc-portal), Starting Phase 2 (apps/governance-portal)  
**Last visited**: 2026-09-26T13:09:00Z  

## Plan & Progress
- [x] 1. apps/phc-portal:
  - [x] Remove useLiveServer branching in `src/hooks/useSyncEngine.ts`
  - [x] Eliminate mock server execution in `src/utils/mockBackend.ts`
  - [x] Remove simulation controls from `src/modules/sync/SyncStatusView.tsx`
  - [x] Remove FALLBACK_FACILITIES and offline PIN bypass in `src/services/phcBackendService.ts`
  - [x] Fix `src/modules/inventory/InventoryView.tsx` (batch_no in update/create)
- [ ] 2. apps/governance-portal:
  - [ ] Remove mockResolvers & mockLink in `src/lib/apolloClient.ts`
  - [ ] Bind `src/app/governance/page.tsx` KPIs and panels to live GraphQL data
  - [ ] Replace static imports of `@/lib/*Data.ts` with live queries in pages (medicine, resources, workforce, patients, forecasts, audit, analytics, gis, syncMonitoring)
- [ ] 3. apps/brics-portal:
  - [ ] Set VITE_USE_MOCK=false in `.env`
  - [ ] Remove SchemaLink, mockLink, resilientFallbackLink in `src/graphql/client.ts`
  - [ ] Remove static mock imports in `src/pages/NodesPage.tsx`, bind to live query
  - [ ] Harmonize operations in `src/graphql/operations.ts` with backend schema
- [ ] 4. Verification & Builds:
  - [ ] Meticulous syntax/type validation
  - [ ] Complete handoff.md and notify parent
