"""
Risk Scoring Engine Router — Prompt 27 (masterplan §35, architecture §5.3)
Full weighted composite formula: shortage + forecast + consumption_acceleration
+ supply_chain + emergency_severity + regional_risk → LOW/MODERATE/HIGH/CRITICAL.
Weights are read from system_config — NEVER hardcoded (masterplan §35, §88).
"""
from fastapi import APIRouter
from models.schemas import RiskScoreRequest, RiskScoreResponse
from utils.stats import compute_risk_score, risk_level_from_score

router = APIRouter(prefix="/score", tags=["Risk Scoring"])

# Default weights (overridden by system_config values passed in request)
DEFAULT_WEIGHTS = {
    "shortage_risk": 25,
    "forecast_risk": 20,
    "consumption_acceleration": 15,
    "supply_chain_risk": 15,
    "emergency_severity": 15,
    "regional_risk": 10,
}


def _compute_shortage_risk(current_stock: float | None, minimum_threshold: float | None) -> float:
    """0–1 scale: 0 = well above threshold, 1 = at or below zero."""
    if current_stock is None or minimum_threshold is None or minimum_threshold <= 0:
        return 0.0
    ratio = current_stock / minimum_threshold
    if ratio <= 0:
        return 1.0
    if ratio >= 2.0:
        return 0.0
    return round(1.0 - (ratio / 2.0), 4)


def _compute_forecast_risk(current_stock: float | None, predicted_demand: float | None) -> float:
    """0–1 scale: how badly does predicted demand exceed current stock?"""
    if current_stock is None or predicted_demand is None or predicted_demand <= 0:
        return 0.0
    if current_stock <= 0:
        return 1.0
    coverage_ratio = current_stock / predicted_demand
    if coverage_ratio >= 1.5:
        return 0.0
    return round(min(1.0 - coverage_ratio / 1.5, 1.0), 4)


@router.post("/risk", response_model=RiskScoreResponse, summary="Composite 6-factor risk score")
def score_risk(req: RiskScoreRequest) -> RiskScoreResponse:
    """
    Masterplan §35 full risk model.
    Returns score (0–100) + risk_level + per-component breakdown.
    Weights are supplied by the caller (sourced from system_config by Node.js backend)
    so a governance admin can change weights in Settings without a redeploy.
    """
    weights = req.weights or DEFAULT_WEIGHTS

    shortage_risk = _compute_shortage_risk(req.current_stock, req.minimum_threshold)
    forecast_risk = _compute_forecast_risk(req.current_stock, req.predicted_value)

    # Normalize inputs to [0, 1] scale
    consumption_acc_norm = min(abs(req.consumption_acceleration), 1.0)
    supply_risk_norm = min(req.supply_chain_delay_days / 14.0, 1.0)   # 14-day delay = max risk
    emergency_norm = min(req.emergency_severity_score, 1.0)
    regional_norm = min(req.regional_risk_score, 1.0)

    score = compute_risk_score(
        shortage_risk=shortage_risk,
        forecast_risk=forecast_risk,
        consumption_acceleration=consumption_acc_norm,
        supply_chain_risk=supply_risk_norm,
        emergency_severity=emergency_norm,
        regional_risk=regional_norm,
        weights=weights,
    )
    level = risk_level_from_score(score)

    return RiskScoreResponse(
        phc_id=req.phc_id,
        medicine_id=req.medicine_id,
        risk_score=score,
        risk_level=level,
        breakdown={
            "shortage_risk": round(shortage_risk * weights.get("shortage_risk", 25), 2),
            "forecast_risk": round(forecast_risk * weights.get("forecast_risk", 20), 2),
            "consumption_acceleration": round(consumption_acc_norm * weights.get("consumption_acceleration", 15), 2),
            "supply_chain_risk": round(supply_risk_norm * weights.get("supply_chain_risk", 15), 2),
            "emergency_severity": round(emergency_norm * weights.get("emergency_severity", 15), 2),
            "regional_risk": round(regional_norm * weights.get("regional_risk", 10), 2),
        },
    )
