"""
Smart Health AI & Demand Forecasting Engine
Member 2 (Backend) — services/ai-engine/
Python 3.11+ | FastAPI | Port 5000

Implements Prompts 23–33 of the backend chain (Abdul_Backend_NEW2.md):
  - Prompt 25: Demand Forecasting (Prophet / XGBoost champion-challenger)
  - Prompt 26: Statistical Anomaly / Early-Warning Detection
  - Prompt 27: Full Risk Scoring Engine
  - Prompt 28: Cross-District Redistribution Optimizer (MILP/PuLP)
  - Prompt 29: Crisis What-If Simulator (Deterministic + Monte Carlo)
  - Prompt 30: Governance AI Copilot (RAG, scoped retrieval)
  - Prompt 31: BRICS Federated Learning Coordinator (FedAvg + DP-SGD + hash-chain)

Integration contract with Node.js backend (Port 8000):
  POST http://localhost:5000/predict/demand        ← nightly batch forecast
  POST http://localhost:5000/detect/anomaly        ← billing.transaction_completed events
  POST http://localhost:5000/score/risk            ← governance dashboard resolver
  POST http://localhost:5000/optimize/redistribution ← redistribution module
  POST http://localhost:5000/simulate/crisis       ← WebSocket simulator session
  POST http://localhost:5000/copilot/query         ← Governance Copilot (pre-scoped context)
  GET  http://localhost:5000/federated/*           ← BRICS portal GraphQL surface

Design constraints (masterplan §88):
  - A PHC worker must NEVER wait for this engine to complete a checkout.
  - AI recommends (status='recommended') — officer decides (status='approved').
  - No model auto-deploys without human approval.
  - Raw PHC records NEVER enter the federated learning module.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import forecast, anomaly, risk, redistribution, simulator, federated, copilot

app = FastAPI(
    title="Smart Health AI & Optimization Engine",
    description=(
        "Demand forecasting (Prophet/XGBoost), anomaly detection, risk scoring, "
        "MILP redistribution optimizer, crisis simulator, governance copilot, "
        "and BRICS federated learning coordinator. "
        "Port 5000 — consumed by Node.js backend on Port 8000."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — allow calls from Node.js backend and all portals ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",   # Node.js backend
        "http://localhost:3000",   # Governance Portal
        "http://localhost:5173",   # PHC Portal (Vite dev)
        "http://localhost:3001",   # BRICS Portal
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount all routers ─────────────────────────────────────────────────────────
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(risk.router)
app.include_router(redistribution.router)
app.include_router(simulator.router)
app.include_router(federated.router)
app.include_router(copilot.router)


# ── Root & Health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def read_root() -> dict:
    return {
        "service": "Smart Health AI & Optimization Engine",
        "status": "online",
        "port": 5000,
        "version": "1.0.0",
        "modules": {
            "forecasting": "Prophet/XGBoost champion-challenger (Prompt 25)",
            "anomaly_detection": "Rolling z-score/EWMA + cross-PHC corroboration (Prompt 26)",
            "risk_scoring": "6-factor configurable composite score (Prompt 27)",
            "redistribution_optimizer": "MILP transportation problem via PuLP+CBC (Prompt 28)",
            "crisis_simulator": "Deterministic + Monte Carlo P50/P90 (Prompt 29)",
            "copilot": "RAG-style scoped governance copilot (Prompt 30)",
            "federated_learning": "FedAvg + DP-SGD + SHA-256 hash-chain BRICS coordinator (Prompt 31)",
        },
    }


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Health check endpoint consumed by Docker Compose and backend liveness probe."""
    dependencies = {}

    # Check Prophet availability
    try:
        import prophet  # noqa: F401
        dependencies["prophet"] = "available"
    except ImportError:
        dependencies["prophet"] = "not_installed (falling back to moving average)"

    # Check XGBoost availability
    try:
        import xgboost  # noqa: F401
        dependencies["xgboost"] = "available"
    except ImportError:
        dependencies["xgboost"] = "not_installed"

    # Check PuLP availability
    try:
        import pulp  # noqa: F401
        dependencies["pulp"] = "available"
    except ImportError:
        dependencies["pulp"] = "not_installed (falling back to greedy heuristic)"

    # Check NumPy/Pandas
    try:
        import numpy  # noqa: F401
        import pandas  # noqa: F401
        dependencies["numpy_pandas"] = "available"
    except ImportError:
        dependencies["numpy_pandas"] = "not_installed"

    overall = "healthy" if all("not_installed" not in v for v in dependencies.values()) else "degraded"

    return {
        "status": overall,
        "dependencies": dependencies,
        "note": "Degraded mode: core API still functional with statistical fallbacks. Install full requirements for ML models.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)
