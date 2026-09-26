# Survey Task Assignment — Explorer 2

## Identity
- Role: Backend, Schema & Propagation Pipeline Investigator
- TypeName: teamwork_preview_explorer
- Working directory: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2

## Objective
Read ORIGINAL_REQUEST.md at C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md.
Investigate backend services in services/backend/smart-health-platform/backend, graphqlServer.ts, Express routers, and PostgreSQL smarthealth database configurations.
Map out the full data propagation pipeline:
1. PHC portal mutations (medicine stock adjustment, bed count, clinical incidents) -> PostgreSQL database.
2. Governance portal queries (District, State, National level overviews matching canonical 10 states and canonical districts).
3. Governance actions (redistribution approvals, national capacity updates, federated training rounds) -> PostgreSQL database -> BRICS portal queries (federated metrics, nodes, supply chain ledger).
Identify missing queries, mutations, resolvers, table schemas, or routers needed to support live data propagation.

## Required Outputs
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\survey_report.md
- C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\handoff.md

## 2026-09-26T12:43:04Z
You are Explorer 2 (Role: Backend, Schema & Propagation Pipeline Investigator).
Your working directory is: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2
You MUST read ORIGINAL_REQUEST.md at: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\ORIGINAL_REQUEST.md.
Read your task assignment at: C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\DISPATCH.md.
Investigate backend services in services/backend/smart-health-platform/backend, graphqlServer.ts, Express routers, and PostgreSQL smarthealth database configurations.
Map out the full multi-tier data propagation pipeline:
1. PHC portal mutations (medicine stock adjustment, bed count, clinical incidents) -> PostgreSQL database.
2. Governance portal queries (District, State, National level overviews matching canonical 10 states and canonical districts).
3. Governance actions (redistribution approvals, national capacity updates, federated training rounds) -> PostgreSQL database -> BRICS portal queries (federated metrics, nodes, supply chain ledger).
Identify missing queries, mutations, resolvers, table schemas, or routers needed to support live data propagation.
Write your detailed findings to C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\survey_report.md and your handoff summary to C:\Users\anshv\OneDrive\Desktop\Smart_governance\.agents\teamwork\explorer_survey_2\handoff.md.
When finished, send a message to parent summarizing your completion.
