# AI Engine — `services/ai-engine/`

> **Member 2 (Backend)** — Python 3.11+ | FastAPI | Port **5000**
> Implements Prompts 23–33 of `Abdul_Backend_NEW2.md`

---

## Module Map

| Module | Endpoint | Masterplan Ref | Status |
|---|---|---|---|
| Demand Forecasting | `POST /predict/demand` | §32–33, arch §5.2 | ✅ Live (Prophet + XGBoost) |
| Anomaly Detection | `POST /detect/anomaly` | §31/§34, arch §5.3 | ✅ Live (z-score/EWMA) |
| Risk Scoring | `POST /score/risk` | §35, arch §5.3 | ✅ Live (6-factor composite) |
| Redistribution Optimizer | `POST /optimize/redistribution` | §36–37, arch §5.4 | ✅ Live (MILP/PuLP+CBC) |
| Crisis Simulator | `POST /simulate/crisis` | §41–42, arch §5.5 | ✅ Live (Deterministic + Monte Carlo) |
| Copilot | `POST /copilot/query` | §43–44, arch §5.6 | ✅ Live (RAG, scoped) |
| BRICS Federated | `GET/POST /federated/*` | §65, arch §5.7 | ✅ Live (FedAvg + DP-SGD) |
| Health | `GET /health` | — | ✅ Live |

---

## Library / Version Reference (Prompt 33 requirement)

| Library | Version | Purpose |
|---|---|---|
| `fastapi` | ≥0.110.0 | HTTP API framework |
| `uvicorn` | ≥0.28.0 | ASGI server |
| `pydantic` | ≥2.6.0 | Schema validation |
| `prophet` | ≥1.1.5 | Time-series forecasting (default champion) |
| `xgboost` | ≥2.0.3 | Gradient boosting challenger model |
| `pulp` | ≥2.8.0 | MILP solver wrapper (CBC backend) |
| `scipy` | ≥1.13.0 | Statistical utilities |
| `numpy` | ≥1.26.0 | Numerical computation |
| `pandas` | ≥2.2.0 | Data manipulation |
| `scikit-learn` | ≥1.4.0 | Feature helpers |
| `httpx` | ≥0.27.0 | Async HTTP client (backend callbacks) |

---

## Retraining Cadence (Prompt 25/32)

| Model | Cadence | Trigger |
|---|---|---|
| Prophet (per-PHC/medicine) | Nightly batch | Scheduled + `POST /predict/demand` |
| XGBoost challenger | Nightly batch | Same nightly job; picks winner by 7-day holdout RMSE |
| Anomaly baselines | Rolling window | Per-call (stateless; 14-day trailing window) |
| Risk weights | On config change | Read from `system_config` via Node.js backend at call time |
| MILP optimizer | Per call | Stateless; no training needed |
| Federated global model | Per round | Human-approved FedAvg aggregation |

---

## DB Roles & Grants (Prompt 23 requirement)

| Subfolder | DB Role | Tables Allowed |
|---|---|---|
| `forecasting/` | `ai_feature_store_role` | `consumption_daily`, `patient_footfall`, `system_config` (read-only) |
| `federated/` | `federated_learning_service` | `federation_training_features` (materialized view, read-only) |
| All others | None (stateless) | No direct DB access — data passed via HTTP from Node.js backend |

> The AI engine **never** connects to the transactional Postgres role. All data flows through the Node.js backend's scoped retrieval endpoints (Prompt 17), not direct DB access from Python.

---

## Integration Contract with Node.js Backend (Port 8000)

```
POST http://localhost:5000/predict/demand          ← nightly forecast batch
POST http://localhost:5000/detect/anomaly          ← billing.transaction_completed events
POST http://localhost:5000/score/risk              ← governance dashboard GraphQL resolver
POST http://localhost:5000/optimize/redistribution ← redistribution optimizer client
POST http://localhost:5000/simulate/crisis         ← WebSocket simulator session
POST http://localhost:5000/copilot/query           ← Governance Copilot (pre-role-filtered context)
GET  http://localhost:5000/federated/nodes         ← BRICS portal node status
GET  http://localhost:5000/federated/rounds        ← BRICS portal round history
POST http://localhost:5000/federated/rounds/start  ← national_admin only
POST http://localhost:5000/federated/aggregate     ← country weight submission
POST http://localhost:5000/federated/{id}/approve  ← human approval of aggregated model
```

---

## Running Locally

```bash
cd services/ai-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
# Docs: http://localhost:5000/docs
# Health: http://localhost:5000/health
```

### Degraded Mode (without full ML libraries)
The engine runs with statistical fallbacks if Prophet/XGBoost/PuLP are not installed:
- Forecasting → enhanced moving average ± 15% confidence band
- Redistribution → greedy heuristic (urgency + distance sort)
- All API contracts remain identical — no contract changes.

---

## Open Decisions (Prompt 33 / masterplan §94)

> [!IMPORTANT]
> **BRICS Federated Learning activation** — The federated coordinator (`routers/federated.py`) is **built but gated**. The masterplan §94 open decision (demonstration vs. architected-for-only) must be confirmed by the full team before `POST /federated/rounds/start` is wired to a live Flower deployment. Until confirmed, the simulated 5-node roster remains the active implementation.

> [!NOTE]
> **Prompt 31 vs Prompt 18 coexistence** — The Node.js backend's `federation` module (Prompt 18 stub) and this engine's `routers/federated.py` serve the same GraphQL surface. The Node.js stub remains live for the BRICS portal specifically until the §94 decision is made; at that point, Prompt 33's swap-in wires this real coordinator in.

---

## Design Constraints (masterplan §88)

- **PHC workers never wait for ML**: All forecasting/optimization is async/batch, decoupled from the checkout transaction path.
- **AI recommends, officer decides**: `redistribution_transfers.status` is only ever set to `'recommended'` from this engine — never `'approved'`.
- **No auto-deploy**: Retrained or aggregated models require human approval before going active.
- **No bare point estimates**: Every prediction carries `confidence_lower` and `confidence_upper` bounds.
- **No raw records in federation**: The federated learning module reads only from `federation_training_features` (aggregated materialized view), never from `billing_transactions`, `patient_footfall`, or any patient-identifiable table.
