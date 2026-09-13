# AI & Optimization Engine

**Component: Member 4 (`services/ai-engine`)**

---

## Overview
The AI Engine performs medicine demand forecasting, stockout anomaly detection, FEFO supply redistribution optimization, and BRICS federated learning coordination.

### Endpoints
- `GET /`: Service health and active model versions.
- `POST /predict/demand`: 14-day consumption projection and stockout risk scoring.

### Run Locally
```bash
pip install -r requirements.txt
python main.py
```
Port: `5000`
