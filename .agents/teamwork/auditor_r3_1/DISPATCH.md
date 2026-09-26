# Dispatch Instructions for Forensic Auditor (teamwork_preview_auditor)

## Identity & Role
- Working Directory: `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\auditor_r3_1`
- Parent: orchestrator_3 (`bd4c7b6b-1aab-437a-b230-ab00ebc0a88b`)

## Scope & Instructions
1. Read the user's original request:
   `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically 2026-09-26T18:24:09Z).
2. Read `c:\Users\anshv\OneDrive\Desktop\Smart_governance\PROJECT.md`.
3. Perform a rigorous forensic integrity audit on all changes made across the repository:
   - Check that implementations are genuine and not hardcoded fake strings.
   - Verify that PostgreSQL database queries are real and executed against the `smarthealth` database.
   - Verify that no mock fallback error links intercept traffic.
   - Check that tests in `run_comprehensive_e2e_audit.ts` execute live HTTP/TCP/DB queries rather than returning canned results.
   - Check that `AUDIT_REPORT.md` reflects real telemetry from live services.
4. Issue a formal binary verdict: `CLEAN` or `INTEGRITY VIOLATION`.
5. Deliver your report in `c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\auditor_r3_1\handoff.md` and notify parent via `send_message`.

## 2026-09-26T19:33:04Z
You are the Forensic Integrity Auditor.
Your working directory is: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\auditor_r3_1
Read instructions in: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\auditor_r3_1\DISPATCH.md
Read the user's original request: c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md (specifically 2026-09-26T18:24:09Z).
Read PROJECT.md and AUDIT_REPORT.md.

Tasks:
1. Conduct forensic integrity audit: inspect code, tests, and database queries.
2. Confirm authentic implementation: verify no fake/hardcoded strings used as substitutes for real functionality.
3. Verify zero mock schema fallbacks or bypasses across all 3 portals.
4. Verify tests execute genuine live queries against PostgreSQL smarthealth database and live HTTP/TCP endpoints.
5. Issue a binary verdict: CLEAN or INTEGRITY VIOLATION.
6. Write handoff to c:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\auditor_r3_1\handoff.md and notify parent (bd4c7b6b-1aab-437a-b230-ab00ebc0a88b).
