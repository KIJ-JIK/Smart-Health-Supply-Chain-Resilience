# Smart Health Core Backend & Sync Engine

**Component: Member 2 (`services/backend`)**

---

## Overview
The Central Sync Backend coordinates offline delta-synchronization with ground-level PHC facilities, stores clinical resource state, tracks active emergencies, and exposes governance APIs.

### Implemented Endpoints
- `GET /health`: Health check and current `server_seq` counter.
- `POST /sync/push`: Batched offline mutations ingest from PHC PWAs (`device_id`, `mutations`).
- `GET /sync/pull`: Pull delta updates since client `server_seq`.
- `GET /api/facilities`: Multi-facility status and capacity telemetry.
- `GET /api/alerts`: Active clinical resource shortage and surge notifications.

### Run Locally
```bash
npm install
npm run dev
```
Port: `8000`
