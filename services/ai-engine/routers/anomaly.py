"""
Statistical Anomaly / Early-Warning Detection Router — Prompt 26 (masterplan §31/§34, architecture §5.3)
Distinct from deterministic threshold alerts (handled by Node.js alerts module, Prompt 13).
Covers: consumption spike, footfall surge, regional outbreak signal.
Results emitted as events for the Node.js alerts module — this module does NOT write to alerts table.
"""
from fastapi import APIRouter
from models.schemas import AnomalyRequest, AnomalyResponse
from utils.stats import rolling_mean_std, z_score, ewma

router = APIRouter(prefix="/detect", tags=["Anomaly Detection"])


def _classify_signal(z: float, has_neighbor_corroboration: bool) -> tuple[str, str]:
    """
    Determine signal type and severity per masterplan §31/§34 cross-PHC corroboration rule.
    A single-PHC spike without neighbor confirmation → isolated_anomaly (not a regional event).
    Multiple PHCs spiking → regional_outbreak_signal.
    """
    if abs(z) < 2.5:
        return "NONE", "none"

    # Isolated spike — no neighbor confirmation
    if not has_neighbor_corroboration:
        if abs(z) >= 4.0:
            severity = "HIGH"
        elif abs(z) >= 3.0:
            severity = "MODERATE"
        else:
            severity = "LOW"
        return severity, "isolated_anomaly"

    # Neighbor-corroborated → escalate to regional signal
    if abs(z) >= 4.0:
        severity = "CRITICAL"
    elif abs(z) >= 3.0:
        severity = "HIGH"
    else:
        severity = "MODERATE"
    return severity, "regional_outbreak_signal"


@router.post("/anomaly", response_model=AnomalyResponse, summary="Rolling z-score / EWMA anomaly detection")
def detect_anomaly(req: AnomalyRequest) -> AnomalyResponse:
    """
    Masterplan §34 statistical anomaly class.
    Uses rolling z-score against trailing `baseline_window_days` mean + EWMA smoothing.
    Cross-checks neighboring PHCs (if provided) before escalating to regional signal.
    Anomaly classes covered: sudden surge, persistent increase, regional cluster,
    abnormal consumption correlation, unusual medicine usage, regional patient surge.
    """
    values = req.values or []
    window = req.baseline_window_days
    threshold = req.sigma_threshold

    if len(values) < 2:
        return AnomalyResponse(
            phc_id=req.phc_id,
            series_type=req.series_type,
            medicine_id=req.medicine_id,
            anomaly_detected=False,
            severity="NONE",
            z_score=0.0,
            baseline_mean=0.0,
            baseline_std=0.0,
            current_value=values[0] if values else 0.0,
            signal_type="none",
            recommendation="Insufficient data for anomaly detection (min 2 data points required).",
        )

    # EWMA-smoothed current value to reduce single-point noise
    current_value = ewma(values[-3:], alpha=0.5) if len(values) >= 3 else values[-1]

    # Baseline from prior window (excluding current observation)
    baseline = values[:-1]
    mean, std = rolling_mean_std(baseline, window)

    z = z_score(current_value, mean, std)

    # Cross-PHC neighbor corroboration
    neighbor_corroborated = False
    if req.neighbor_phc_values:
        n_mean, n_std = rolling_mean_std(req.neighbor_phc_values[:-1], window)
        n_current = req.neighbor_phc_values[-1] if req.neighbor_phc_values else 0
        n_z = z_score(n_current, n_mean, n_std)
        neighbor_corroborated = abs(n_z) >= threshold

    anomaly_detected = abs(z) >= threshold
    severity, signal_type = _classify_signal(z, neighbor_corroborated) if anomaly_detected else ("NONE", "none")

    # Generate recommendation string
    if not anomaly_detected:
        recommendation = "No anomaly detected. Values within normal range."
    elif signal_type == "isolated_anomaly":
        recommendation = (
            f"Isolated {req.series_type} spike at PHC {req.phc_id} "
            f"(z={z:.2f}). Monitor for continuation. No regional escalation required without neighbor confirmation."
        )
    else:
        recommendation = (
            f"Regional {req.series_type} outbreak signal detected "
            f"(z={z:.2f}, neighbor-corroborated). Escalate to district admin. "
            f"Consider emergency redistribution."
        )

    return AnomalyResponse(
        phc_id=req.phc_id,
        series_type=req.series_type,
        medicine_id=req.medicine_id,
        anomaly_detected=anomaly_detected,
        severity=severity,
        z_score=round(z, 4),
        baseline_mean=round(mean, 4),
        baseline_std=round(std, 4),
        current_value=round(current_value, 4),
        signal_type=signal_type,
        recommendation=recommendation,
    )
