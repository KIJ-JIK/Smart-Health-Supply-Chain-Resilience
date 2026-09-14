# AI & Optimization Engine

**Component: Member 4 (`services/ai-engine`)**

---

## Overview
The AI Engine performs medicine demand forecasting, stockout and consumption anomaly detection, cross-district supply redistribution optimization, crisis what-if simulation, and BRICS sovereign federated learning coordination.

### Architecture References
- **Masterplan**: §52 (Forecasting), §53 (Anomaly Detection), §54 (Redistribution), §55 (Crisis Simulator), §65 (BRICS Federated AI)
- **Architecture**: §5.2, §5.3, §5.4, §5.5, §5.7

### Endpoints (Port 5000)
- `GET /`: Service overview, loaded models, and endpoint directory.
- `GET /health`: Microservice health check.
- `POST /predict/demand`: Prophet-style Fourier seasonal projection (14–30 days), confidence bounds (85%–115%), stockout risk rating (`NORMAL`/`MODERATE`/`HIGH`/`CRITICAL`), and recommended reorder quantity.
- `POST /detect/anomalies`: Rolling EWMA / statistical z-score anomaly detector flagging spikes > 3σ (outbreak signals).
- `POST /optimize/redistribution`: Cross-district supply redistribution solver matching surplus PHCs to deficit PHCs minimizing distance while rewarding urgency fulfillment.
- `POST /simulate/crisis`: What-if scenario simulator (footfall surges, supply shock) projecting bed occupancy, oxygen depletion, and workforce deficits.
- `GET /federation/status`: Real-time telemetry on the 5 BRICS sovereign nodes (IN, BR, RU, CN, ZA) and privacy budget limit.
- `POST /federation/round/simulate`: Federated Averaging (FedAvg) aggregation round simulator with Differential Privacy ($\epsilon, \delta$) noise generation and SHA-256 weight hash chaining.

### Run Locally
```bash
# Using virtual environment (already provisioned at .venv)
python main.py

# Or via Monorepo root:
npm run dev:ai
```
Default Port: `5000`

