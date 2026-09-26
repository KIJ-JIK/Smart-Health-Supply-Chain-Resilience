"""
Shared Pydantic schemas for Smart Health AI Engine.
All models carry confidence intervals — never bare point estimates (masterplan §88.9).
"""
from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ─────────────────────────────────────────────
# Forecast schemas  (Prompts 25, 33)
# ─────────────────────────────────────────────
class ForecastRequest(BaseModel):
    phc_id: str
    medicine_id: Optional[str] = None
    forecast_type: str = "medicine_demand"  # medicine_demand|bed_demand|oxygen_demand|staff_requirement|patient_footfall|resource_shortage
    historical_daily_consumption: List[float] = []
    footfall_history: List[float] = []
    current_stock: Optional[float] = None
    days_ahead: int = Field(default=14, ge=1, le=90)
    safety_buffer_pct: float = Field(default=20.0, ge=0)
    district_id: Optional[str] = None


class ForecastResponse(BaseModel):
    phc_id: str
    medicine_id: Optional[str]
    forecast_type: str
    forecast_date: str   # ISO date string (start of horizon)
    horizon_days: int
    predicted_value: float
    confidence_lower: float
    confidence_upper: float
    forecasted_daily_demand: List[float]
    projected_stockout_day: Optional[int]   # days until stockout; None if no risk
    stockout_risk: str                       # NORMAL | WARNING | CRITICAL
    recommended_reorder_qty: int
    model_used: str
    model_version: str
    generated_at: str
    district_id: Optional[str] = None


# ─────────────────────────────────────────────
# Anomaly / Early-Warning schemas  (Prompt 26)
# ─────────────────────────────────────────────
class AnomalyRequest(BaseModel):
    phc_id: str
    series_type: str = "consumption"        # consumption | footfall
    medicine_id: Optional[str] = None
    values: List[float]                     # recent values (oldest first)
    baseline_window_days: int = 14
    sigma_threshold: float = 2.5
    neighbor_phc_values: Optional[List[float]] = None  # for cross-PHC corroboration


class AnomalyResponse(BaseModel):
    phc_id: str
    series_type: str
    medicine_id: Optional[str]
    anomaly_detected: bool
    severity: str                   # NONE | LOW | MODERATE | HIGH | CRITICAL
    z_score: float
    baseline_mean: float
    baseline_std: float
    current_value: float
    signal_type: str                # none | isolated_anomaly | regional_outbreak_signal
    recommendation: str


# ─────────────────────────────────────────────
# Risk Scoring schemas  (Prompt 27)
# ─────────────────────────────────────────────
class RiskScoreRequest(BaseModel):
    phc_id: str
    medicine_id: Optional[str] = None
    current_stock: Optional[float] = None
    minimum_threshold: Optional[float] = None
    predicted_value: Optional[float] = None    # from forecast
    consumption_acceleration: float = 0.0
    supply_chain_delay_days: float = 0.0
    emergency_severity_score: float = 0.0
    regional_risk_score: float = 0.0
    # configurable weights (loaded from system_config; defaults shown)
    weights: Optional[Dict[str, float]] = None


class RiskScoreResponse(BaseModel):
    phc_id: str
    medicine_id: Optional[str]
    risk_score: float               # 0–100
    risk_level: str                 # LOW | MODERATE | HIGH | CRITICAL
    breakdown: Dict[str, float]     # component-by-component scores


# ─────────────────────────────────────────────
# Redistribution Optimizer schemas  (Prompt 28)
# ─────────────────────────────────────────────
class SurplusNode(BaseModel):
    phc_id: str
    medicine_id: str
    available_qty: float
    expiry_date: str          # ISO date; batches expiring before transit excluded
    latitude: float = 0.0
    longitude: float = 0.0


class DeficitNode(BaseModel):
    phc_id: str
    medicine_id: str
    deficit_qty: float
    urgency: str              # routine | urgent | critical
    latitude: float = 0.0
    longitude: float = 0.0


class RedistributionRequest(BaseModel):
    surplus_nodes: List[SurplusNode]
    deficit_nodes: List[DeficitNode]
    max_transit_days: float = 3.0
    urgency_lambda: float = 10.0          # how much urgency reward dominates distance cost
    redistribution_max_distance_km: float = 500.0


class TransferRecommendation(BaseModel):
    source_phc_id: str
    dest_phc_id: str
    medicine_id: str
    quantity: float
    urgency: str
    distance_km: float
    estimated_benefit: float
    reasoning: str


class RedistributionResponse(BaseModel):
    status: str                              # optimal | infeasible | partial
    recommendations: List[TransferRecommendation]
    total_deficit_fulfilled: float
    solver_notes: str


# ─────────────────────────────────────────────
# Crisis Simulator schemas  (Prompt 29)
# ─────────────────────────────────────────────
class CrisisScenario(BaseModel):
    footfall_delta_pct: float = 0.0        # e.g. +30.0 means 30% surge
    supply_delta_pct: float = 0.0          # e.g. -20.0 means 20% supply cut
    affected_district_ids: List[str] = []
    duration_days: int = 30
    monte_carlo: bool = False
    monte_carlo_runs: int = 200


class CrisisSimResponse(BaseModel):
    scenario: CrisisScenario
    additional_beds_needed: float
    additional_oxygen_needed: float
    additional_medicine_by_type: Dict[str, float]
    additional_staff_needed: float
    most_affected_districts: List[str]
    projected_stockout_medicines: List[str]
    # Monte Carlo bands (only populated when monte_carlo=True)
    p50: Optional[Dict[str, float]] = None
    p90: Optional[Dict[str, float]] = None


# ─────────────────────────────────────────────
# BRICS Federated Learning schemas  (Prompt 31)
# ─────────────────────────────────────────────
class NodeStatus(BaseModel):
    country_code: str           # IN | BR | RU | CN | ZA
    country_name: str
    node_status: str            # ONLINE | OFFLINE | TRAINING | AGGREGATING
    last_seen: Optional[str]
    model_version: Optional[str]
    cumulative_epsilon: float
    budget_limit: float
    budget_remaining: float


class FederatedRound(BaseModel):
    id: str
    round_number: int
    status: str                 # pending | training | aggregating | completed | rejected
    started_at: Optional[str]
    completed_at: Optional[str]
    previous_entry_hash: str
    this_hash: str
    participating_countries: List[str]
    global_model_version: Optional[str]
    privacy_budget_spent: Optional[float]


class StartRoundRequest(BaseModel):
    model_id: str
    target_epsilon: float = Field(gt=0.0, le=5.0)
    participating_countries: List[str] = ["IN", "BR", "RU", "CN", "ZA"]


class AggregateRequest(BaseModel):
    round_id: str
    country_code: str
    local_weight_updates: List[float]   # simulated gradient update vector
    clip_norm: float = 1.0
    noise_multiplier: float = 1.1
    epsilon_spent: float = 0.5


class ApproveRoundRequest(BaseModel):
    round_id: str
    decision: str    # approve | reject
    notes: Optional[str] = None


class PrivacyBudgetEntry(BaseModel):
    country_code: str
    federation_round_id: str
    epsilon_spent: float
    cumulative_epsilon: float
    budget_limit: float
    within_budget: bool


# ─────────────────────────────────────────────
# AI Copilot schemas  (Prompt 30)
# ─────────────────────────────────────────────
class CopilotRequest(BaseModel):
    question: str
    role: str                           # national_admin | state_admin | district_admin | phc_user
    scope_id: Optional[str] = None     # state_id / district_id / phc_id based on role
    # Pre-filtered context snippets from Node.js backend (role-scoped before reaching here)
    context_snippets: List[str] = []
    alert_ids: List[str] = []
    recommendation_ids: List[str] = []


class CopilotResponse(BaseModel):
    answer: str
    supporting_data: Dict[str, Any]
    source_alert_id: Optional[str]
    source_recommendation_id: Optional[str]
    timestamp: str
    model_version: str
    confidence: str                    # HIGH | MEDIUM | LOW | INSUFFICIENT_CONTEXT
    limitations: Optional[str] = None
    # For "why" questions
    current_stock: Optional[float] = None
    consumption_rate: Optional[float] = None
    forecast_demand: Optional[float] = None
    projected_stockout_days: Optional[int] = None
    relevant_threshold: Optional[float] = None
    recommendation_logic: Optional[str] = None
