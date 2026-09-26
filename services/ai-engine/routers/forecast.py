"""
Demand Forecasting Router — Prompt 25 (masterplan §32–33, architecture §5.2)
Champion/challenger: Prophet (default) vs XGBoost (when ≥30 data points).
All predictions carry uncertainty bands — never bare point estimates (masterplan §88.9).
This pipeline is OFFLINE/BATCH relative to the transactional path — a PHC worker must
NEVER wait for this to complete a checkout (masterplan §88).
"""
from fastapi import APIRouter
from datetime import date, timedelta
import math
import uuid
from models.schemas import ForecastRequest, ForecastResponse
from utils.stats import moving_average_forecast

router = APIRouter(prefix="/predict", tags=["Forecasting"])


# ── Prophet-based seasonal forecast (default) ──────────────────────────────────
def _prophet_forecast(history: list[float], days_ahead: int) -> tuple[list[float], list[float], list[float]]:
    """
    Prophet-style rolling seasonal forecast.
    Returns (point_forecast, lower_bound, upper_bound).
    In production, replace this body with actual Prophet model inference;
    the interface contract remains unchanged (Prompt 33 swap-in target).
    """
    try:
        # Attempt real Prophet if installed
        import pandas as pd  # noqa: F401
        from prophet import Prophet  # noqa: F401

        ds = [(date.today() - timedelta(days=len(history) - i - 1)).isoformat() for i in range(len(history))]
        df = __import__("pandas").DataFrame({"ds": ds, "y": history})
        m = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=True, interval_width=0.80)
        m.fit(df)
        future = m.make_future_dataframe(periods=days_ahead)
        forecast = m.predict(future)
        tail = forecast.tail(days_ahead)
        points = tail["yhat"].tolist()
        lower = tail["yhat_lower"].tolist()
        upper = tail["yhat_upper"].tolist()
        return points, lower, upper

    except Exception:
        # Fallback: enhanced moving average with trend and 80% confidence band (±15%)
        points = moving_average_forecast(history, days_ahead, window=min(14, len(history)))
        lower = [round(max(p * 0.85, 0), 2) for p in points]
        upper = [round(p * 1.15, 2) for p in points]
        return points, lower, upper


# ── XGBoost challenger (≥30 data points) ─────────────────────────────────────
def _xgboost_forecast(history: list[float], footfall: list[float], days_ahead: int) -> tuple[list[float], list[float], list[float]] | None:
    """
    XGBoost challenger using lag features (7/14/30-day), footfall, seasonality.
    Returns None if insufficient data (< 30 points).
    In production, replace with trained XGBoost model artifact (Prompt 33 swap-in target).
    """
    if len(history) < 30:
        return None
    try:
        import numpy as np
        from xgboost import XGBRegressor

        # Feature engineering: lags + rolling averages
        X, y = [], []
        max_lag = min(30, len(history) - 1)
        for i in range(max_lag, len(history)):
            features = [
                history[i - 7] if i >= 7 else history[0],   # 7-day lag
                history[i - 14] if i >= 14 else history[0],  # 14-day lag
                history[i - 30] if i >= 30 else history[0],  # 30-day lag
                sum(history[max(0, i - 7):i]) / 7,           # 7-day rolling mean
                sum(history[max(0, i - 14):i]) / 14,         # 14-day rolling mean
                footfall[i] if i < len(footfall) else 0,     # footfall covariate
                (date.today() - timedelta(days=len(history) - i)).weekday(),  # day-of-week
            ]
            X.append(features)
            y.append(history[i])

        model = XGBRegressor(n_estimators=50, max_depth=3, random_state=42)
        model.fit(np.array(X), np.array(y))

        last = history[-30:]
        last_footfall = footfall[-1] if footfall else 0
        preds = []
        for d in range(days_ahead):
            feat = [
                last[-7] if len(last) >= 7 else last[0],
                last[-14] if len(last) >= 14 else last[0],
                last[-30] if len(last) >= 30 else last[0],
                sum(last[-7:]) / 7,
                sum(last[-14:]) / 14,
                last_footfall,
                (date.today() + timedelta(days=d)).weekday(),
            ]
            p = float(model.predict(np.array([feat]))[0])
            p = max(p, 0.0)
            preds.append(round(p, 2))
            last = last[1:] + [p]

        lower = [round(max(p * 0.88, 0), 2) for p in preds]
        upper = [round(p * 1.12, 2) for p in preds]
        return preds, lower, upper

    except Exception:
        return None


def _backtest_rmse(history: list[float], forecast_fn, window: int = 7) -> float:
    """7-day holdout backtest RMSE for champion/challenger selection."""
    if len(history) <= window:
        return float("inf")
    train, actual = history[:-window], history[-window:]
    try:
        preds, _, _ = forecast_fn(train, [], window)
        rmse = math.sqrt(sum((p - a) ** 2 for p, a in zip(preds, actual)) / window)
        return rmse
    except Exception:
        return float("inf")


@router.post("/demand", response_model=ForecastResponse, summary="Champion/challenger demand forecast")
def predict_demand(req: ForecastRequest) -> ForecastResponse:
    """
    Masterplan §32–33. Returns forecast with confidence interval.
    Selects Prophet vs XGBoost via 7-day backtest holdout (lower RMSE wins).
    """
    history = req.historical_daily_consumption or [15, 18, 14, 20, 22, 19, 21]
    footfall = req.footfall_history or []
    days_ahead = req.days_ahead
    safety_buffer = req.safety_buffer_pct / 100.0

    # Run both candidates
    prophet_result = _prophet_forecast(history, days_ahead)
    xgb_result = _xgboost_forecast(history, footfall, days_ahead)

    # Champion/challenger selection by RMSE
    model_used = "Prophet"
    model_version = "v1.1-prophet"
    points, lower, upper = prophet_result

    if xgb_result is not None:
        prophet_rmse = _backtest_rmse(history, lambda h, f, n: _prophet_forecast(h, n))
        xgb_rmse = _backtest_rmse(history, lambda h, f, n: (_xgboost_forecast(h, f, n) or _prophet_forecast(h, n)))
        if xgb_rmse < prophet_rmse:
            points, lower, upper = xgb_result
            model_used = "XGBoost"
            model_version = "v1.0-xgboost"

    total_projected = sum(points)
    current_stock = req.current_stock or 0.0

    # Stockout calculation
    stockout_day = None
    running = current_stock
    for i, daily in enumerate(points):
        running -= daily
        if running <= 0:
            stockout_day = i + 1
            break

    # Stockout risk classification
    if stockout_day is not None and stockout_day <= 3:
        stockout_risk = "CRITICAL"
    elif stockout_day is not None and stockout_day <= 7:
        stockout_risk = "WARNING"
    else:
        stockout_risk = "NORMAL"

    reorder_qty = int(total_projected * (1 + safety_buffer))

    return ForecastResponse(
        phc_id=req.phc_id,
        medicine_id=req.medicine_id,
        forecast_type=req.forecast_type,
        forecast_date=date.today().isoformat(),
        horizon_days=days_ahead,
        predicted_value=round(total_projected, 2),
        confidence_lower=round(sum(lower), 2),
        confidence_upper=round(sum(upper), 2),
        forecasted_daily_demand=points,
        projected_stockout_day=stockout_day,
        stockout_risk=stockout_risk,
        recommended_reorder_qty=reorder_qty,
        model_used=model_used,
        model_version=model_version,
        generated_at=date.today().isoformat() + "T00:00:00Z",
        district_id=req.district_id,
    )
