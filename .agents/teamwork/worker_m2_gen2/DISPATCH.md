# Task Assignment — Worker M2 (Gen 2: Replacement from Interruption Point)

## Identity
- Role: Backend Pipeline Replacement Worker
- TypeName: teamwork_preview_worker
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m2_gen2

## Mandatory References
- ORIGINAL_REQUEST.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (MUST READ FIRST)
- PROJECT.md: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md

## Exclusive Write Ownership
You EXCLUSIVELY own files in:
- `services/backend/smart-health-platform/backend/**`
Do NOT modify files in `apps/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Prior Progress (Worker M2 Gen 1)
Predecessor worker already completed:
1. `modules/governance/graphqlServer.ts` has been updated with dynamic SQL aggregations for `stateOverview` and `districtOverview`, resilient slug/code matching, `federatedRound(id)`, `FederatedModelVersion`, and `decideRedistribution` event publishing.
2. `modules/governance/redistributionController.ts` has already been created with GET `/recommendations` and POST `/:id/decision`.

## Exact Remaining Tasks (Complete these to finish Milestone M2):
1. **Mount Redistribution Router**:
   - In `services/backend/smart-health-platform/backend/src/index.ts`:
     - Import `redistributionRouter` from `./modules/governance/redistributionController`.
     - Mount it: `app.use('/api/v1/governance/redistribution', redistributionRouter);`.
2. **Update `syncService.ts`**:
   - In `services/backend/smart-health-platform/backend/src/modules/sync/syncService.ts`:
     - In `executeMutation` (around line 200), add case `'inventory_batch_create'`: route to `handleInventoryMutation(client, phcId, m)`.
     - In `handleInventoryMutation`, in the `'inventory_batch_update'` branch:
       If `p.batch_no` is absent, perform:
       `UPDATE inventory_batches SET remaining_qty = $1, updated_at = NOW() WHERE id = $2 OR (phc_id = $3 AND medicine_id = $4)`
       using `p.remaining_qty`, `p.batch_id || p.id`, `phcId`, `p.medicine_id`.
     - In alert handling, map incoming `'outbreak'` alert type to `'outbreak_risk'`.
3. **Build & Typecheck Verification**:
   - Run `npx tsc --noEmit` in `services/backend/smart-health-platform/backend` to verify clean TypeScript compilation with 0 errors.
4. **Handoff**:
   - Author `handoff.md` in your working directory and notify parent via send_message.

## 2026-09-26T13:45:23Z
You are Worker M2 Gen 2 (Role: Backend Pipeline Replacement Worker).
Your working directory is: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m2_gen2
You MUST read ORIGINAL_REQUEST.md at: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md.
Read your full task assignment at: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m2_gen2\DISPATCH.md.
Read PROJECT.md at: C:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md.

EXCLUSIVE WRITE OWNERSHIP:
You EXCLUSIVELY own files in:
- services/backend/smart-health-platform/backend/**
Do NOT modify files in apps/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context:
Your predecessor already updated graphqlServer.ts with dynamic aggregations and BRICS resolvers, and created modules/governance/redistributionController.ts!

Exact Remaining Tasks:
1. In src/index.ts:
   - Import redistributionRouter from './modules/governance/redistributionController'.
   - Mount it: app.use('/api/v1/governance/redistribution', redistributionRouter);
2. In src/modules/sync/syncService.ts:
   - In executeMutation, add case 'inventory_batch_create': route to handleInventoryMutation.
   - In handleInventoryMutation, in 'inventory_batch_update': if p.batch_no is missing, update inventory_batches by id (or batch_id) to update remaining_qty and updated_at.
   - Map 'outbreak' alert type to 'outbreak_risk'.
3. Run `npx tsc --noEmit` in services/backend/smart-health-platform/backend to verify clean compilation with 0 errors.
4. Author handoff.md in C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_m2_gen2\handoff.md and send message to parent upon completion.
