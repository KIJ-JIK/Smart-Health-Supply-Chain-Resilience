# Dispatch Instructions for Challenger 2 (Boundary & Route Stress Verifier)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_2`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & Instructions
1. Read the user's original request:
   `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically 2026-09-26T18:24:09Z).
2. Read `c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md`.
3. Read `AUDIT_REPORT.md` and Worker handoffs.
4. Stress-test boundary conditions:
   - Challenge 1: Verify all 16 Governance routes on port 3000 respond with HTTP 200 under rapid requests.
   - Challenge 2: Verify all 36 Indian states/UTs in PostgreSQL topology and verify no disconnected GIS layers.
   - Challenge 3: Verify Dexie offline mutation queueing: does duplicate mutation handling prevent corruption? Does pull delta correctly supply updates?
5. Provide your verdict: `APPROVE` or `REJECT`.
6. Deliver your report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_2\handoff.md` and notify parent via `send_message`.

## 2026-09-26T19:33:04Z
You are Challenger 2 (Boundary & Route Stress Verifier).
Your working directory is: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_2
Read instructions in: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_2\DISPATCH.md
Read the user's original request: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (specifically 2026-09-26T18:24:09Z).
Read PROJECT.md and AUDIT_REPORT.md.

Tasks:
1. Challenge all 16 Governance routes on port 3000.
2. Challenge 36 Indian states/UTs PostgreSQL topology and GIS coverage.
3. Challenge Dexie offline mutation queue push/pull consistency.
4. Issue verdict: APPROVE or REJECT.
5. Write handoff to c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_2\handoff.md and notify parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b).

