# Dispatch Instructions for Worker 2 (BRICS Review Gate Status & DP 5.0 Ceiling Alignment)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_frontend_2`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & File Ownership
You exclusively own and may edit:
- `apps/brics-portal/src/pages/RoundReviewPage.tsx`
- `apps/brics-portal/src/pages/PrivacyPage.tsx`
- `apps/brics-portal/src/hooks/use-member-privacy-budget.ts`
- `apps/brics-portal/src/components/privacy/PrivacyBudgetGauge.tsx`
- `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts`

## Mandatory Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks
1. Model Review Gate Action Buttons in `apps/brics-portal/src/pages/RoundReviewPage.tsx`:
   - Inspect line 206 and line 428. Currently `isAwaitingReview = candidateRound.status === 'awaiting_review';`.
   - When a simulation round is started, its status in DB is `'started'` or `'training'` or `'awaiting_review'`.
   - Update `isAwaitingReview` so that rounds with status `'awaiting_review'`, `'training'`, or `'started'` render the actionable "Authorize & Publish Global Model" (`approveAggregatedModel`) and "Reject & Quarantine Round" (`rejectAggregatedModel`) buttons.
   - Ensure the actions work smoothly and trigger the corresponding GraphQL mutations.
2. Differential Privacy Bound Normalization (ε ≤ 5.0):
   - In `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts`:
     - Around line 1172, change `COALESCE(budget_limit, 10.0)::float AS "budgetLimit"` to `COALESCE(budget_limit, 5.0)::float AS "budgetLimit"`.
     - Check any other references in `graphqlServer.ts` default limit parameters to ensure 5.0 is the regulatory ceiling.
   - In `apps/brics-portal/src/pages/PrivacyPage.tsx`:
     - Line 64: change `entries[0]?.budgetLimit ?? 10.0` to `5.0`.
     - Lines 255, 280: update any static copy or badge referencing 10.0 to 5.0.
   - In `apps/brics-portal/src/hooks/use-member-privacy-budget.ts`:
     - Line 36: update default `10.0` to `5.0`.
   - In `apps/brics-portal/src/components/privacy/PrivacyBudgetGauge.tsx`:
     - Line 17: update default `10.0` to `5.0`.
3. Build Verification:
   - Run typecheck / build on `apps/brics-portal` (`npm run build` or `npx tsc --noEmit`).
   - Run typecheck on backend `graphqlServer.ts` (`npx tsc --noEmit`).
4. Deliver handoff report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_frontend_2\handoff.md` with build verification results, and notify parent via `send_message`.

## 2026-09-26T18:43:15Z
You are Worker 2 (BRICS Review Gate Status & DP 5.0 Ceiling Alignment).
Your working directory is: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_frontend_2
Read instructions in: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_frontend_2\DISPATCH.md
Read the user's original request: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (specifically 2026-09-26T18:24:09Z).
Read PROJECT.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. In `apps/brics-portal/src/pages/RoundReviewPage.tsx`, update `isAwaitingReview` so candidate rounds with status `'awaiting_review'`, `'training'`, or `'started'` render actionable "Authorize & Publish Global Model" and "Reject & Quarantine Round" buttons.
2. In `services/backend/smart-health-platform/backend/src/modules/governance/graphqlServer.ts`, change fallback `budget_limit` from 10.0 to 5.0.
3. In `apps/brics-portal/src/pages/PrivacyPage.tsx`, `use-member-privacy-budget.ts`, and `PrivacyBudgetGauge.tsx`, align all fallback default limits and text from 10.0 to 5.0.
4. Run typecheck / build on `apps/brics-portal` and `backend` to ensure 0 build errors.
5. Write handoff report to `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\worker_r3_frontend_2\handoff.md` and message parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b).
