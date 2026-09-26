# Dispatch Instructions for Challenger 1 (Adversarial Robustness & Rate-Limit Stress)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_1`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & Instructions
1. Read the user's original request:
   `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically 2026-09-26T18:24:09Z).
2. Read `c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md`.
3. Read `AUDIT_REPORT.md` and Worker handoffs.
4. Stress-test and challenge the system adversarially:
   - Challenge 1: Verify Gemini 3-key pool under simulated rate limits (429 RESOURCE_EXHAUSTED). Does it rotate cleanly without leaking exceptions or crashing?
   - Challenge 2: Verify Differential Privacy regulatory boundary. Does attempting to allocate ε > 5.0 strictly get rejected with 422? Are all database ledger records ≤ 5.0?
   - Challenge 3: Verify FEFO batch allocation under concurrent or low stock.
5. Provide your verdict: `APPROVE` or `REJECT`.
6. Deliver your report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\challenger_r3_1\handoff.md` and notify parent via `send_message`.
