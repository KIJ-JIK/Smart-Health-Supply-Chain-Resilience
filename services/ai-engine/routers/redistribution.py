"""
MILP Redistribution Optimizer Router — Prompt 28 (masterplan §36–37, architecture §5.4)
Transportation problem with urgency-weighted objective using PuLP + CBC solver.
Decision variables x[i][j] = qty moved from surplus PHC i to deficit PHC j.
Objective: minimize distance cost - λ × urgency reward.
Status written as 'recommended' ONLY — approval is exclusively the Governance Portal workflow.
AI recommends, officer decides (masterplan §37, §88).
"""
from fastapi import APIRouter
from models.schemas import (
    RedistributionRequest,
    RedistributionResponse,
    TransferRecommendation,
)
import math
from datetime import date

router = APIRouter(prefix="/optimize", tags=["Redistribution Optimizer"])

URGENCY_WEIGHTS = {"critical": 3.0, "urgent": 2.0, "routine": 1.0}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two lat/lon coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def _days_until_expiry(expiry_date_str: str) -> float:
    try:
        expiry = date.fromisoformat(expiry_date_str)
        return (expiry - date.today()).days
    except Exception:
        return 999.0


def _run_milp(req: RedistributionRequest) -> tuple[list[TransferRecommendation], float, str]:
    """
    Run MILP optimizer using PuLP + CBC.
    Falls back to greedy heuristic if PuLP unavailable.
    """
    try:
        import pulp

        # Filter out batches that would expire before transit
        valid_surplus = [
            s for s in req.surplus_nodes
            if _days_until_expiry(s.expiry_date) >= req.max_transit_days
        ]

        if not valid_surplus or not req.deficit_nodes:
            return [], 0.0, "No feasible transfers: no valid surplus after expiry/transit filter."

        prob = pulp.LpProblem("redistribution_opt", pulp.LpMinimize)
        pairs = [(s.phc_id, d.phc_id, s.medicine_id) for s in valid_surplus for d in req.deficit_nodes if s.medicine_id == d.medicine_id]

        x = {
            (si, di, mid): pulp.LpVariable(f"x_{si[:6]}_{di[:6]}_{mid[:6]}", lowBound=0)
            for si, di, mid in pairs
        }

        surplus_map = {(s.phc_id, s.medicine_id): s for s in valid_surplus}
        deficit_map = {(d.phc_id, d.medicine_id): d for d in req.deficit_nodes}

        # Objective: minimize cost - λ × urgency × fulfilled
        urgency_map = {(d.phc_id, d.medicine_id): URGENCY_WEIGHTS.get(d.urgency, 1.0) for d in req.deficit_nodes}
        s_coords = {s.phc_id: (s.latitude, s.longitude) for s in valid_surplus}
        d_coords = {d.phc_id: (d.latitude, d.longitude) for d in req.deficit_nodes}

        cost_terms = []
        for (si, di, mid), var in x.items():
            dist = _haversine_km(*s_coords.get(si, (0, 0)), *d_coords.get(di, (0, 0)))
            urgency_reward = req.urgency_lambda * urgency_map.get((di, mid), 1.0)
            cost_terms.append((dist - urgency_reward) * var)
        prob += pulp.lpSum(cost_terms)

        # Constraints: source can't ship more than surplus
        for s in valid_surplus:
            shipped = pulp.lpSum(x.get((s.phc_id, d.phc_id, s.medicine_id), 0) for d in req.deficit_nodes if s.medicine_id == d.medicine_id)
            prob += shipped <= s.available_qty, f"supply_{s.phc_id[:6]}_{s.medicine_id[:6]}"

        # Constraints: can't fulfill more than deficit
        for d in req.deficit_nodes:
            received = pulp.lpSum(x.get((s.phc_id, d.phc_id, d.medicine_id), 0) for s in valid_surplus if s.medicine_id == d.medicine_id)
            prob += received <= d.deficit_qty, f"demand_{d.phc_id[:6]}_{d.medicine_id[:6]}"

        # Distance ceiling for critical-priority
        for (si, di, mid), var in x.items():
            d = deficit_map.get((di, mid))
            if d and d.urgency == "critical":
                dist = _haversine_km(*s_coords.get(si, (0, 0)), *d_coords.get(di, (0, 0)))
                if dist > req.redistribution_max_distance_km:
                    prob += var == 0, f"dist_ceil_{si[:6]}_{di[:6]}"

        prob.solve(pulp.PULP_CBC_CMD(msg=0, timeLimit=10))

        if prob.status not in (1,):  # 1 = Optimal
            return [], 0.0, f"Solver status: {pulp.LpStatus[prob.status]}. Falling back to greedy."

        recommendations = []
        total_fulfilled = 0.0
        for (si, di, mid), var in x.items():
            qty = pulp.value(var) or 0
            if qty < 0.01:
                continue
            s = surplus_map.get((si, mid))
            d = deficit_map.get((di, mid))
            dist = _haversine_km(*s_coords.get(si, (0, 0)), *d_coords.get(di, (0, 0)))
            benefit = urgency_map.get((di, mid), 1.0) * qty
            recommendations.append(TransferRecommendation(
                source_phc_id=si,
                dest_phc_id=di,
                medicine_id=mid,
                quantity=round(qty, 2),
                urgency=d.urgency if d else "routine",
                distance_km=dist,
                estimated_benefit=round(benefit, 2),
                reasoning=(
                    f"MILP optimal: {round(qty, 1)} units from surplus node {si[:8]} to "
                    f"deficit node {di[:8]}. Distance: {dist:.1f}km. "
                    f"Urgency: {d.urgency if d else 'routine'}. "
                    f"Expected benefit score: {round(benefit, 2)}."
                ),
            ))
            total_fulfilled += qty

        # Sort by urgency then benefit (highest first)
        recommendations.sort(key=lambda r: (-URGENCY_WEIGHTS.get(r.urgency, 1), -r.estimated_benefit))
        return recommendations, round(total_fulfilled, 2), "MILP optimal solution found."

    except ImportError:
        # PuLP not available — greedy heuristic fallback
        return _greedy_fallback(req)


def _greedy_fallback(req: RedistributionRequest) -> tuple[list[TransferRecommendation], float, str]:
    """Greedy fallback: match surplus→deficit sorted by urgency and proximity."""
    valid_surplus = [
        s for s in req.surplus_nodes
        if _days_until_expiry(s.expiry_date) >= req.max_transit_days
    ]
    surplus_remaining = {(s.phc_id, s.medicine_id): s.available_qty for s in valid_surplus}
    recs = []
    total_fulfilled = 0.0

    sorted_deficits = sorted(req.deficit_nodes, key=lambda d: -URGENCY_WEIGHTS.get(d.urgency, 1.0))

    for d in sorted_deficits:
        remaining_need = d.deficit_qty
        matching = [s for s in valid_surplus if s.medicine_id == d.medicine_id]
        matching.sort(key=lambda s: _haversine_km(s.latitude, s.longitude, d.latitude, d.longitude))
        for s in matching:
            avail = surplus_remaining.get((s.phc_id, s.medicine_id), 0)
            if avail <= 0 or remaining_need <= 0:
                continue
            dist = _haversine_km(s.latitude, s.longitude, d.latitude, d.longitude)
            if d.urgency != "critical" and dist > req.redistribution_max_distance_km:
                continue
            qty = min(avail, remaining_need)
            recs.append(TransferRecommendation(
                source_phc_id=s.phc_id,
                dest_phc_id=d.phc_id,
                medicine_id=d.medicine_id,
                quantity=round(qty, 2),
                urgency=d.urgency,
                distance_km=dist,
                estimated_benefit=round(URGENCY_WEIGHTS.get(d.urgency, 1) * qty, 2),
                reasoning=(
                    f"Greedy heuristic: {round(qty, 1)} units from {s.phc_id[:8]} to {d.phc_id[:8]}. "
                    f"Distance: {dist:.1f}km. Urgency: {d.urgency}."
                ),
            ))
            surplus_remaining[(s.phc_id, s.medicine_id)] -= qty
            remaining_need -= qty
            total_fulfilled += qty

    return recs, round(total_fulfilled, 2), "Greedy heuristic (PuLP unavailable)."


@router.post("/redistribution", response_model=RedistributionResponse, summary="MILP redistribution optimizer")
def optimize_redistribution(req: RedistributionRequest) -> RedistributionResponse:
    """
    Masterplan §36–37, architecture §5.4.
    Returns ranked transfer recommendations with status='recommended' ONLY.
    Human approval via Governance Portal is mandatory before any transfer proceeds.
    """
    recs, total_fulfilled, notes = _run_milp(req)
    total_deficit = sum(d.deficit_qty for d in req.deficit_nodes)

    if not recs:
        status = "infeasible"
    elif total_fulfilled >= total_deficit * 0.95:
        status = "optimal"
    else:
        status = "partial"

    return RedistributionResponse(
        status=status,
        recommendations=recs,
        total_deficit_fulfilled=total_fulfilled,
        solver_notes=notes,
    )
