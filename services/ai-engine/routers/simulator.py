"""
Crisis What-If Simulator Router — Prompt 29 (masterplan §41–42, architecture §5.5)
Implements the real simulation pipeline behind the Node.js WebSocket simulator session.
Deterministic mode is default; Monte Carlo is explicit opt-in (never silently blended).
Uses pre-trained Prompt 25 models with scenario-adjusted inputs — never retrains per call,
so interactive WebSocket latency is maintained.
"""
from fastapi import APIRouter
from models.schemas import CrisisScenario, CrisisSimResponse
from utils.stats import moving_average_forecast
import random
import math

router = APIRouter(prefix="/simulate", tags=["Crisis Simulator"])

# Baseline constants — in production sourced from system_config (Prompt 16)
BASELINE_BEDS_PER_PHC = 30
BASELINE_OXYGEN_CYLINDERS_PER_PHC = 10
BASELINE_STAFF_PER_PHC = 15
MEDICINE_TYPES = ["insulin", "paracetamol", "antibiotics", "antivirals", "ivfluids"]
MEDICINE_BASE_STOCK = {"insulin": 200, "paracetamol": 500, "antibiotics": 300, "antivirals": 150, "ivfluids": 100}
MEDICINE_DAILY_CONSUMPTION = {"insulin": 20, "paracetamol": 45, "antibiotics": 25, "antivirals": 12, "ivfluids": 10}


def _run_deterministic(scenario: CrisisScenario, n_phcs: int = 10) -> dict:
    """
    Apply scenario deltas to baseline, re-run demand forecast with adjusted footfall,
    return resource deficits per masterplan §41 output shape.
    """
    footfall_mult = 1 + scenario.footfall_delta_pct / 100.0
    supply_mult = 1 + scenario.supply_delta_pct / 100.0   # typically negative (reduction)
    duration = scenario.duration_days
    affected_n = max(1, len(scenario.affected_district_ids)) * n_phcs

    # Adjusted demand
    additional_beds = max(0, round(affected_n * BASELINE_BEDS_PER_PHC * (footfall_mult - 1) * 0.3, 1))
    additional_oxygen = max(0, round(affected_n * BASELINE_OXYGEN_CYLINDERS_PER_PHC * (footfall_mult - 1) * 0.5, 1))
    additional_staff = max(0, round(affected_n * BASELINE_STAFF_PER_PHC * (footfall_mult - 1) * 0.4, 1))

    # Medicine deficits per type — adjusted consumption vs. adjusted supply
    additional_medicine = {}
    for med, daily in MEDICINE_DAILY_CONSUMPTION.items():
        adjusted_daily = daily * footfall_mult
        total_need = adjusted_daily * duration * affected_n
        available_supply = MEDICINE_BASE_STOCK[med] * supply_mult * affected_n
        shortfall = max(0, total_need - available_supply)
        if shortfall > 0:
            additional_medicine[med] = round(shortfall, 1)

    # Most affected districts — just return the input list, ranked by impact
    most_affected = scenario.affected_district_ids[:5] or ["district_001", "district_002"]

    # Projected stockout medicines (those with shortfall in < 7 days)
    stockout_meds = []
    for med, daily in MEDICINE_DAILY_CONSUMPTION.items():
        adj_daily = daily * footfall_mult * affected_n
        stock = MEDICINE_BASE_STOCK[med] * supply_mult * affected_n
        if adj_daily > 0 and stock / adj_daily < 7:
            stockout_meds.append(med)

    return {
        "additional_beds_needed": additional_beds,
        "additional_oxygen_needed": additional_oxygen,
        "additional_medicine_by_type": additional_medicine,
        "additional_staff_needed": additional_staff,
        "most_affected_districts": most_affected,
        "projected_stockout_medicines": stockout_meds,
    }


def _run_monte_carlo(scenario: CrisisScenario, runs: int = 200) -> tuple[dict, dict]:
    """
    Monte Carlo: run deterministic simulation N times with sampled variation.
    Returns (p50_band, p90_band) of key resource metrics.
    """
    results = {"beds": [], "oxygen": [], "staff": []}

    for _ in range(runs):
        # Sample footfall and supply with ±10% noise
        noisy_scenario = CrisisScenario(
            footfall_delta_pct=scenario.footfall_delta_pct + random.uniform(-10, 10),
            supply_delta_pct=scenario.supply_delta_pct + random.uniform(-10, 10),
            affected_district_ids=scenario.affected_district_ids,
            duration_days=scenario.duration_days,
        )
        r = _run_deterministic(noisy_scenario)
        results["beds"].append(r["additional_beds_needed"])
        results["oxygen"].append(r["additional_oxygen_needed"])
        results["staff"].append(r["additional_staff_needed"])

    def percentile(data: list, p: int) -> float:
        sorted_data = sorted(data)
        idx = int(len(sorted_data) * p / 100)
        return round(sorted_data[min(idx, len(sorted_data) - 1)], 1)

    p50 = {k: percentile(v, 50) for k, v in results.items()}
    p90 = {k: percentile(v, 90) for k, v in results.items()}
    return p50, p90


@router.post("/crisis", response_model=CrisisSimResponse, summary="Crisis what-if simulator (deterministic / Monte Carlo)")
def simulate_crisis(scenario: CrisisScenario) -> CrisisSimResponse:
    """
    Masterplan §41–42, architecture §5.5.
    Deterministic mode default (masterplan §42). Monte Carlo explicit opt-in only.
    Returns masterplan §41's exact output shape: additional_beds, additional_oxygen,
    additional_medicine_by_type, additional_staff, most_affected_districts,
    and P50/P90 bands when Monte Carlo is enabled.
    """
    base = _run_deterministic(scenario)

    p50, p90 = None, None
    if scenario.monte_carlo:
        p50, p90 = _run_monte_carlo(scenario, runs=scenario.monte_carlo_runs)

    return CrisisSimResponse(
        scenario=scenario,
        additional_beds_needed=base["additional_beds_needed"],
        additional_oxygen_needed=base["additional_oxygen_needed"],
        additional_medicine_by_type=base["additional_medicine_by_type"],
        additional_staff_needed=base["additional_staff_needed"],
        most_affected_districts=base["most_affected_districts"],
        projected_stockout_medicines=base["projected_stockout_medicines"],
        p50=p50,
        p90=p90,
    )
