"""
Statistical utility functions — rolling z-score, EWMA, etc.
Used by anomaly detection (Prompt 26) and risk scoring (Prompt 27).
"""
import math
from typing import List, Tuple


def rolling_mean_std(values: List[float], window: int) -> Tuple[float, float]:
    """Compute mean and std of the last `window` values."""
    if not values:
        return 0.0, 0.0
    subset = values[-window:]
    if len(subset) < 2:
        return float(subset[0]) if subset else 0.0, 0.0
    mean = sum(subset) / len(subset)
    variance = sum((x - mean) ** 2 for x in subset) / (len(subset) - 1)
    return mean, math.sqrt(variance)


def ewma(values: List[float], alpha: float = 0.3) -> float:
    """Exponentially weighted moving average — most recent value weighted most."""
    if not values:
        return 0.0
    result = values[0]
    for v in values[1:]:
        result = alpha * v + (1 - alpha) * result
    return result


def z_score(current_value: float, mean: float, std: float) -> float:
    """Standard z-score; returns 0 if std is zero."""
    if std == 0:
        return 0.0
    return (current_value - mean) / std


def moving_average_forecast(history: List[float], days_ahead: int, window: int = 7) -> List[float]:
    """Simple moving-average forecast baseline."""
    if not history:
        return [0.0] * days_ahead
    mean = sum(history[-window:]) / min(len(history), window)
    return [round(mean, 2)] * days_ahead


def compute_risk_score(
    shortage_risk: float,
    forecast_risk: float,
    consumption_acceleration: float,
    supply_chain_risk: float,
    emergency_severity: float,
    regional_risk: float,
    weights: dict,
) -> float:
    """
    Weighted composite risk score clamped to [0, 100].
    Weights are read from system_config (never hardcoded — masterplan §35).
    """
    raw = (
        weights.get("shortage_risk", 25) * shortage_risk
        + weights.get("forecast_risk", 20) * forecast_risk
        + weights.get("consumption_acceleration", 15) * consumption_acceleration
        + weights.get("supply_chain_risk", 15) * supply_chain_risk
        + weights.get("emergency_severity", 15) * emergency_severity
        + weights.get("regional_risk", 10) * regional_risk
    ) / 100.0
    return min(max(round(raw, 2), 0.0), 100.0)


def risk_level_from_score(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    elif score >= 50:
        return "HIGH"
    elif score >= 25:
        return "MODERATE"
    return "LOW"
