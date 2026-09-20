# Governance Portal (Standalone Frontend)

This application is the central governance portal for the Health Supply Chain System. It is built as a standalone Next.js frontend, currently utilizing mock data and simulated real-time connections to allow parallel development while the backend is constructed.

## 1. Mock API Contracts (GraphQL / REST)

### GraphQL Schema (Apollo Mock)
The frontend uses Apollo Client with `MockLink` to intercept GraphQL operations. 
Location: `src/lib/apolloClient.ts` & `src/graphql/mockResolvers.ts`

**Queries:**
- `GET_NATIONAL_OVERVIEW`: Fetches aggregate metrics (KPIs, active crisis status, emergencies).
- `GET_STATE_OVERVIEW(stateId)`: Fetches state-level aggregated KPI metrics.
- `GET_DISTRICT_OVERVIEW(districtId)`: Fetches district-level aggregated KPI metrics.
- `GET_SUPPLY_CHAIN_SHIPMENTS`: Fetches shipment tracking data and inter-node transitions.
- `GET_ALERTS_HISTORY`: Fetches historical alerts/early warnings.
- `GET_COPILOT_HISTORY`: Fetches chat history for the AI Copilot.

**Mutations:**
- `ACKNOWLEDGE_ALERT`: Marks an alert as acknowledged.
- `CREATE_COPILOT_MESSAGE`: Submits a prompt to the AI Copilot.
- `CREATE_REDISTRIBUTION_RECOMMENDATION`: Submits a proposed supply transfer.

### REST Endpoints (Simulated via Next.js API Routes / Local Data)
- **Analytics Exports:** `GET /api/v1/analytics/export?tier=...&format=...` (Currently simulated locally in `AnalyticsPage` via timeout).
- **Audit Logs:** Data read from `useAuditStore` (local Zustand state).
- **Configuration (Thresholds):** Data read/written via `useConfigStore` (local Zustand state).

## 2. Simulated SSE / WebSocket Contracts

The portal relies heavily on real-time data streaming for live monitoring. These are currently simulated using custom React hooks (`useSseStream.ts` and `useWsSession.ts`) connecting to mock endpoints or simulated data generators.

### Server-Sent Events (SSE) - `useSseStream`
- **`GET /api/v1/governance/alerts/stream`**: Streams live early warning alerts. Consumed by the `Header` component for the global notification bell and `EarlyWarningsPage`.
- **`GET /governance/kpi/stream`**: Streams live telemetry updates (e.g., active stockouts, critical shortages). Consumed by the `Dashboard` (`page.tsx`) for live KPI ticker updates.

### WebSockets - `useWsSession`
- **`WS /api/v1/governance/simulator/session`**: Real-time bidirectional connection for the Crisis Simulator. Handles starting scenarios and receiving sequential event streams.
- **`WS /api/v1/governance/copilot/stream` (Planned/Potential)**: Copilot responses currently use a mock mutation, but a WS stream is recommended for real-time token streaming.

## 3. Integration Assumptions for Backend Team (Member 4)

Please confirm the following assumptions made during frontend development:

1. **Role-Based Scope Enforcement:**
   - The frontend enforces strict bounds on query parameters based on user roles (National, State, District admins) using `getEnforcedScope`.
   - **Assumption:** The backend implements Row-Level Security (RLS) or rigorous authorization checks to prevent data leakage if a user bypasses the frontend client (e.g., via direct API calls with spoofed IDs).

2. **GraphQL Operations:**
   - **Assumption:** The backend GraphQL endpoint will support standard query batching and handle the exact operation names and shapes defined in `src/graphql/queries.ts`.

3. **SSE Connection Limits & Cleanup:**
   - The frontend implements proper cleanup on unmount (`close()`), but users might keep tabs open for extended periods.
   - **Assumption:** The backend SSE infrastructure can handle long-lived, idle connections efficiently (e.g., using Redis Pub/Sub backplanes) and sends periodic keep-alive pings to prevent proxy timeouts.

4. **Async Report Generation:**
   - The `AnalyticsPage` assumes report generation is non-blocking. It expects the backend to accept a generation request and process it asynchronously.
   - **Assumption:** The backend will generate reports (PDF/CSV) via a worker queue and store them in an S3-compatible Object Storage, providing a direct download URL once ready.

5. **AI Copilot Data Source Tracking:**
   - **Assumption:** The backend RAG / LLM service will return structured citations (source alert/recommendation IDs, dataset references, model version, limitations) alongside the response text, as required by the Copilot Response Contract.

6. **Offline Sync & Mutation Queue:**
   - The `SyncMonitoringView` displays metrics based on a `mutation_queue` structure.
   - **Assumption:** Mobile clients push their mutation queues with `client_timestamp` and `local_seq`. The backend resolves conflicts and updates the sync status (accepted, duplicate, conflict).

7. **Data Freshness and Metrics:**
   - **Assumption:** Key metrics (utilization percentages, vacancy rates, coverage days) are calculated at the materialized view or edge level on the backend, rather than requiring the client to aggregate raw facility data.
