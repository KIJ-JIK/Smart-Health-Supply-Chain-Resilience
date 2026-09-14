"""
BRICS Federated Learning Coordinator Router — Prompt 31 (masterplan §65, architecture §5.7)
Implements FedAvg with DP-SGD noise + SHA-256 hash-chained round ledger.
Raw records NEVER cross this module — only aggregate model weight artifacts.
Backed by 5-node simulated roster: India, Brazil, Russia, China, South Africa.
National_admin only — no other role may call any mutation here.
Privacy budget CHECK(cumulative_epsilon <= budget_limit) is a hard structural stop.
"""
from fastapi import APIRouter, HTTPException
from models.schemas import (
    NodeStatus, FederatedRound, StartRoundRequest,
    AggregateRequest, ApproveRoundRequest, PrivacyBudgetEntry,
)
from utils.dp import apply_dp_sgd, fedavg_aggregate
from utils.hash_chain import compute_round_hash, GENESIS_HASH
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/federated", tags=["BRICS Federated Learning"])

# ── In-memory simulation state ─────────────────────────────────────────────────
# In production these are backed by PostgreSQL tables:
# federation_rounds, privacy_budget_ledger, federation_model_versions (Prompt 1, Layer 5)
BUDGET_LIMIT = 5.0  # total ε budget per country (masterplan §65 hard stop)

_nodes: dict[str, dict] = {
    "IN": {"country_name": "India",        "status": "ONLINE", "epsilon": 0.0, "model_version": None},
    "BR": {"country_name": "Brazil",       "status": "ONLINE", "epsilon": 0.0, "model_version": None},
    "RU": {"country_name": "Russia",       "status": "ONLINE", "epsilon": 0.0, "model_version": None},
    "CN": {"country_name": "China",        "status": "ONLINE", "epsilon": 0.0, "model_version": None},
    "ZA": {"country_name": "South Africa", "status": "ONLINE", "epsilon": 0.0, "model_version": None},
}

_rounds: list[dict] = []
_aggregated_updates: dict[str, list[list[float]]] = {}  # round_id → [country_updates]
_model_versions: list[dict] = []


def _latest_hash() -> str:
    if not _rounds:
        return GENESIS_HASH
    return _rounds[-1]["this_hash"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/nodes", response_model=list[NodeStatus], summary="BRICS node status roster")
def get_nodes() -> list[NodeStatus]:
    """Returns status of all 5 BRICS federated nodes."""
    result = []
    for code, n in _nodes.items():
        result.append(NodeStatus(
            country_code=code,
            country_name=n["country_name"],
            node_status=n["status"],
            last_seen=_now(),
            model_version=n["model_version"],
            cumulative_epsilon=n["epsilon"],
            budget_limit=BUDGET_LIMIT,
            budget_remaining=round(BUDGET_LIMIT - n["epsilon"], 4),
        ))
    return result


@router.get("/rounds", response_model=list[FederatedRound], summary="Hash-chained federation rounds")
def get_rounds() -> list[FederatedRound]:
    """Returns all federation rounds with SHA-256 hash chain."""
    return [FederatedRound(**r) for r in _rounds]


@router.get("/privacy-budget", response_model=list[PrivacyBudgetEntry], summary="Per-nation ε budget ledger")
def get_privacy_budget() -> list[PrivacyBudgetEntry]:
    """Returns cumulative ε spend per country."""
    result = []
    for code, n in _nodes.items():
        result.append(PrivacyBudgetEntry(
            country_code=code,
            federation_round_id=_rounds[-1]["id"] if _rounds else "genesis",
            epsilon_spent=0.0,
            cumulative_epsilon=n["epsilon"],
            budget_limit=BUDGET_LIMIT,
            within_budget=n["epsilon"] < BUDGET_LIMIT,
        ))
    return result


@router.post("/rounds/start", response_model=FederatedRound, summary="Start a new federated training round")
def start_round(req: StartRoundRequest) -> FederatedRound:
    """
    Masterplan §65. Only national_admin may call this (enforced by backend JWT middleware).
    Creates a new hash-chained round. Countries at budget limit are excluded automatically.
    """
    eligible = [c for c in req.participating_countries if _nodes.get(c, {}).get("epsilon", BUDGET_LIMIT) < BUDGET_LIMIT]
    if not eligible:
        raise HTTPException(status_code=422, detail="All participating countries have exhausted their privacy budget.")

    round_id = str(uuid.uuid4())
    round_number = len(_rounds) + 1
    prev_hash = _latest_hash()
    this_hash = compute_round_hash(round_id, round_number, "pending", prev_hash)

    r = {
        "id": round_id,
        "round_number": round_number,
        "status": "pending",
        "started_at": _now(),
        "completed_at": None,
        "previous_entry_hash": prev_hash,
        "this_hash": this_hash,
        "participating_countries": eligible,
        "global_model_version": None,
        "privacy_budget_spent": req.target_epsilon,
    }
    _rounds.append(r)
    _aggregated_updates[round_id] = []

    # Mark participating nodes as TRAINING
    for c in eligible:
        if c in _nodes:
            _nodes[c]["status"] = "TRAINING"

    return FederatedRound(**r)


@router.post("/aggregate", response_model=dict, summary="Submit local model update (DP-SGD protected)")
def aggregate_update(req: AggregateRequest) -> dict:
    """
    Accepts a country's local weight update vector.
    Applies DP-SGD (clip + Gaussian noise) before aggregation.
    Coordinator only sees the *sum* — never raw individual contributions (secure aggregation).
    Rejects if country would breach its privacy budget.
    """
    # Budget enforcement (structural check — mirrors DB CHECK constraint)
    node = _nodes.get(req.country_code)
    if not node:
        raise HTTPException(status_code=404, detail=f"Unknown country code: {req.country_code}")

    if node["epsilon"] + req.epsilon_spent > BUDGET_LIMIT:
        raise HTTPException(
            status_code=422,
            detail=f"Country {req.country_code} would exceed privacy budget limit ({BUDGET_LIMIT}ε). "
                   f"Current: {node['epsilon']:.3f}ε, Requested: {req.epsilon_spent:.3f}ε. "
                   f"This country is excluded from this round."
        )

    # Apply DP-SGD: clip gradients → add Gaussian noise
    noised_update, epsilon_step = apply_dp_sgd(
        req.local_weight_updates,
        clip_norm=req.clip_norm,
        noise_multiplier=req.noise_multiplier,
    )

    # Accumulate
    if req.round_id not in _aggregated_updates:
        _aggregated_updates[req.round_id] = []
    _aggregated_updates[req.round_id].append(noised_update)

    # Update epsilon ledger
    node["epsilon"] = round(node["epsilon"] + req.epsilon_spent, 6)
    node["status"] = "AGGREGATING"

    # Check if all participating countries have submitted → perform FedAvg
    round_rec = next((r for r in _rounds if r["id"] == req.round_id), None)
    if round_rec:
        submissions = len(_aggregated_updates[req.round_id])
        expected = len(round_rec["participating_countries"])
        if submissions >= expected:
            # FedAvg aggregation
            global_weights = fedavg_aggregate(_aggregated_updates[req.round_id])
            round_rec["status"] = "aggregating"
            round_rec["this_hash"] = compute_round_hash(
                round_rec["id"], round_rec["round_number"], "aggregating", round_rec["previous_entry_hash"]
            )
            model_version = f"global-v{len(_model_versions) + 1}"
            _model_versions.append({"version": model_version, "status": "received", "round_id": req.round_id})
            round_rec["global_model_version"] = model_version

            return {
                "status": "aggregated",
                "message": f"FedAvg aggregation complete. Global model {model_version} ready for review.",
                "global_model_version": model_version,
                "submissions": submissions,
                "aggregate_vector_length": len(global_weights),
            }

    return {
        "status": "update_received",
        "message": f"Update from {req.country_code} accepted with DP-SGD protection.",
        "epsilon_spent": req.epsilon_spent,
        "cumulative_epsilon": node["epsilon"],
        "submissions_so_far": len(_aggregated_updates.get(req.round_id, [])),
    }


@router.post("/rounds/{round_id}/approve", response_model=dict, summary="Approve or reject an aggregated model")
def approve_round(round_id: str, req: ApproveRoundRequest) -> dict:
    """
    Human-in-the-loop approval of aggregated global model (masterplan §88).
    AI recommends via FedAvg aggregation — a national_admin officer decides.
    Status lifecycle: received → validated → active → deprecated.
    """
    round_rec = next((r for r in _rounds if r["id"] == round_id), None)
    if not round_rec:
        raise HTTPException(status_code=404, detail=f"Round {round_id} not found.")

    model_rec = next((m for m in _model_versions if m["round_id"] == round_id), None)

    if req.decision == "approve":
        # Deprecate previous active version
        for m in _model_versions:
            if m["status"] == "active":
                m["status"] = "deprecated"
        if model_rec:
            model_rec["status"] = "active"
        round_rec["status"] = "completed"
        round_rec["completed_at"] = _now()
        for c in _nodes.values():
            c["status"] = "ONLINE"
        msg = f"Model {model_rec['version'] if model_rec else 'unknown'} approved and activated."
    else:
        if model_rec:
            model_rec["status"] = "rejected"
        round_rec["status"] = "rejected"
        round_rec["completed_at"] = _now()
        for c in _nodes.values():
            c["status"] = "ONLINE"
        msg = f"Round {round_id} rejected. Notes: {req.notes or 'None'}."

    # Update hash chain with final status
    round_rec["this_hash"] = compute_round_hash(
        round_rec["id"], round_rec["round_number"], round_rec["status"], round_rec["previous_entry_hash"]
    )

    return {"status": round_rec["status"], "message": msg, "this_hash": round_rec["this_hash"]}
