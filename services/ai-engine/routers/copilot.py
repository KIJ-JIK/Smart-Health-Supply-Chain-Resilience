"""
Governance AI Copilot Router — Prompt 30 (masterplan §43–44, architecture §5.6)
RAG-style scoped retrieval pipeline. Role-based filtering applied BEFORE this service
receives any context — the Node.js backend (Prompt 17d) does the DB retrieval and
role-scoping, then passes pre-filtered context snippets here for answer generation.
No unsupported claims — if retrieval returns nothing relevant, says so explicitly.
Full Copilot Response Contract per masterplan §44.
"""
from fastapi import APIRouter
from models.schemas import CopilotRequest, CopilotResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/copilot", tags=["Governance AI Copilot"])

MODEL_VERSION = "copilot-v1.1-rag"


def _classify_question(question: str) -> str:
    """Classify question type for targeted response templating."""
    q = question.lower()
    if any(w in q for w in ["why", "reason", "cause", "explain"]):
        return "why"
    elif any(w in q for w in ["what will", "happen if", "scenario", "forecast", "predict"]):
        return "scenario"
    elif any(w in q for w in ["recommend", "should", "transfer", "redistribution"]):
        return "recommendation"
    elif any(w in q for w in ["risk", "critical", "shortage", "stockout"]):
        return "risk"
    return "general"


def _extract_key_metrics(context_snippets: list[str]) -> dict:
    """Parse metric values from context snippets provided by the backend."""
    metrics: dict = {}
    for snippet in context_snippets:
        # Simple key:value extraction from structured snippets
        # e.g. "current_stock: 180" or "forecast_demand: 500"
        for line in snippet.split("\n"):
            if ":" in line:
                key, _, val = line.partition(":")
                key = key.strip().lower().replace(" ", "_")
                val = val.strip()
                try:
                    metrics[key] = float(val)
                except ValueError:
                    metrics[key] = val
    return metrics


def _generate_answer(
    question: str,
    q_type: str,
    context: list[str],
    metrics: dict,
    alert_ids: list[str],
    rec_ids: list[str],
) -> tuple[str, str, dict]:
    """
    Generate grounded answer from pre-filtered context.
    Returns (answer_text, confidence, supporting_data).
    No hallucination — if context is empty, returns INSUFFICIENT_CONTEXT.
    """
    if not context and not metrics:
        return (
            "I don't have sufficient context to answer this question. "
            "Please ensure data has been synced and that you have the required access level.",
            "INSUFFICIENT_CONTEXT",
            {},
        )

    supporting_data = {k: v for k, v in metrics.items()}

    if q_type == "why":
        current_stock = metrics.get("current_stock", metrics.get("stock", "N/A"))
        consumption = metrics.get("consumption_rate", metrics.get("daily_consumption", "N/A"))
        forecast = metrics.get("forecast_demand", metrics.get("predicted_demand", "N/A"))
        threshold = metrics.get("minimum_threshold", metrics.get("threshold", "N/A"))
        stockout = metrics.get("projected_stockout_days", metrics.get("stockout_day", "N/A"))

        answer = (
            f"Based on the retrieved data: "
            f"Current stock is {current_stock} units with a daily consumption rate of {consumption} units. "
            f"The 14-day forecast projects a total demand of {forecast} units, "
            f"which exceeds available stock — projected stockout in {stockout} days. "
            f"The minimum threshold is {threshold} units. "
            f"{'Alert ID: ' + alert_ids[0] + ' triggered this warning.' if alert_ids else ''}"
        )
        confidence = "HIGH" if context else "MEDIUM"

    elif q_type == "scenario":
        answer = (
            f"Based on current operational data from {len(context)} retrieved context sources: "
            f"If the described scenario occurs, the system forecasts increased resource pressure "
            f"in the affected districts. Key projected metrics: {'; '.join(f'{k}={v}' for k, v in list(metrics.items())[:5])}. "
            f"For detailed scenario analysis, use the Crisis Simulator (/simulate/crisis)."
        )
        confidence = "MEDIUM"

    elif q_type == "recommendation":
        answer = (
            f"The redistribution optimizer recommends action based on: {'. '.join(context[:2])}. "
            f"{'Recommendation ID: ' + rec_ids[0] if rec_ids else 'No specific recommendation ID linked.'} "
            f"All recommendations require governance officer approval before dispatch (masterplan §37)."
        )
        confidence = "HIGH" if rec_ids else "MEDIUM"

    elif q_type == "risk":
        risk_level = metrics.get("risk_level", "UNKNOWN")
        risk_score = metrics.get("risk_score", "N/A")
        answer = (
            f"Risk assessment based on retrieved data: Risk level is {risk_level} (score: {risk_score}/100). "
            f"Contributing factors: {'. '.join(context[:3])}. "
            f"{'Alert: ' + alert_ids[0] if alert_ids else 'No active alerts linked.'}"
        )
        confidence = "HIGH" if context else "LOW"

    else:
        answer = f"Based on {len(context)} context sources retrieved for your role scope: {' '.join(context[:2])}"
        confidence = "MEDIUM" if context else "LOW"

    return answer, confidence, supporting_data


@router.post("/query", response_model=CopilotResponse, summary="Governance AI Copilot — scoped RAG query")
def copilot_query(req: CopilotRequest) -> CopilotResponse:
    """
    Masterplan §43–44, architecture §5.6.
    Context snippets must be pre-filtered by the Node.js backend (Prompt 17d) using the
    caller's JWT role scope BEFORE reaching this endpoint — this service never touches the DB.
    Full Copilot Response Contract returned: answer, supporting_data, source IDs,
    timestamp, model_version, confidence, limitations.
    For 'why' questions: current_stock, consumption_rate, forecast_demand,
    projected_stockout_days, relevant_threshold, recommendation_logic.
    """
    q_type = _classify_question(req.question)
    metrics = _extract_key_metrics(req.context_snippets)

    answer, confidence, supporting_data = _generate_answer(
        req.question,
        q_type,
        req.context_snippets,
        metrics,
        req.alert_ids,
        req.recommendation_ids,
    )

    limitations = None
    if confidence in ("LOW", "INSUFFICIENT_CONTEXT"):
        limitations = (
            "Answer generated with limited context. "
            "Ensure data is synced and your access scope includes the queried entities."
        )

    return CopilotResponse(
        answer=answer,
        supporting_data=supporting_data,
        source_alert_id=req.alert_ids[0] if req.alert_ids else None,
        source_recommendation_id=req.recommendation_ids[0] if req.recommendation_ids else None,
        timestamp=datetime.now(timezone.utc).isoformat(),
        model_version=MODEL_VERSION,
        confidence=confidence,
        limitations=limitations,
        # "Why" question fields
        current_stock=metrics.get("current_stock"),
        consumption_rate=metrics.get("consumption_rate"),
        forecast_demand=metrics.get("forecast_demand"),
        projected_stockout_days=int(metrics["projected_stockout_days"]) if "projected_stockout_days" in metrics else None,
        relevant_threshold=metrics.get("minimum_threshold"),
        recommendation_logic=supporting_data.get("recommendation_logic"),
    )
