#!/usr/bin/env python3
"""
================================================================================
DEVELOPMENT MEMBER-NODE SIMULATION RUNNER -- SYNTHETIC DATA ONLY
================================================================================
CRITICAL NOTICE:
This script generates strictly SYNTHETIC, DETERMINISTIC development fixtures
for verifying the BRICS Federated Learning FedAvg aggregation pipeline in the
AI Engine.

It does NOT use, read, extract, or represent real national health data or PHC
records from India, Brazil, Russia, China, South Africa, or any other member.
All local weight update vectors are artificial mathematical artifacts labeled
with synthetic_development_update = True.

Architecture Context:
- Masterplan section 65, architecture section 5.7
- Endpoint: POST http://localhost:5000/federated/aggregate
- Differential Privacy: DP-SGD with Gaussian noise + L2 clipping
- Aggregation: Federated Averaging (FedAvg) across 5 BRICS member enclaves
================================================================================
"""

import argparse
import json
import random
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional


def http_get(url: str) -> Any:
    """Send an HTTP GET request and return parsed JSON."""
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_post(url: str, payload: Dict[str, Any]) -> Any:
    """Send an HTTP POST request with JSON body and return parsed JSON."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def generate_synthetic_weights(
    seed: int, round_id: str, country_code: str, length: int = 10
) -> List[float]:
    """
    Generate deterministic, synthetic local weight update vectors.
    Strictly synthetic mathematical fixtures for development simulation.
    """
    derived_seed = f"{seed}_{round_id}_{country_code}"
    rng = random.Random(derived_seed)
    return [round(rng.gauss(0.0, 0.25), 6) for _ in range(length)]


def find_target_round(
    ai_engine_url: str, requested_round_id: Optional[str]
) -> Dict[str, Any]:
    """
    Discover active/pending round from the AI Engine or validate requested round.
    """
    rounds_url = f"{ai_engine_url.rstrip('/')}/federated/rounds"
    try:
        rounds = http_get(rounds_url)
    except urllib.error.URLError as e:
        print(f"[ERROR] Failed to connect to AI Engine at {rounds_url}: {e}")
        print("Ensure the AI Engine is running (e.g., uvicorn main:app on port 5000).")
        sys.exit(1)

    if not rounds:
        print("[ERROR] No federation rounds exist in AI Engine memory.")
        print(
            "Please launch a training round first via the BRICS Portal UI or GraphQL mutation,"
        )
        print("or use POST /federated/rounds/start on the AI Engine.")
        sys.exit(1)

    if requested_round_id:
        match = next((r for r in rounds if r.get("id") == requested_round_id), None)
        if not match:
            print(f"[ERROR] Specified round_id '{requested_round_id}' not found.")
            print(f"Available round IDs: {[r.get('id') for r in rounds]}")
            sys.exit(1)
        return match

    # Auto-discover: pick the latest round with status == 'pending'
    pending = [r for r in rounds if r.get("status") == "pending"]
    if pending:
        selected = pending[-1]
        print(
            f"[INFO] Auto-selected latest pending round: #{selected.get('round_number')} (ID: {selected.get('id')})"
        )
        return selected

    latest = rounds[-1]
    print(
        f"[WARNING] No rounds currently in 'pending' status. Latest round is #{latest.get('round_number')} "
        f"with status '{latest.get('status')}'. Target ID: {latest.get('id')}"
    )
    return latest


def run_simulation(args: argparse.Namespace) -> None:
    ai_engine_url = args.ai_engine_url.rstrip("/")
    countries = [c.strip().upper() for c in args.countries.split(",") if c.strip()]

    print("=" * 78)
    print(" BRICS FEDERATED LEARNING: MEMBER-NODE SIMULATION RUNNER")
    print(" [DEVELOPMENT FIXTURE -- SYNTHETIC DATA ONLY]")
    print("=" * 78)
    print(f" Coordinator URL:      {ai_engine_url}")
    print(f" Target Countries:     {', '.join(countries)}")
    print(f" Vector Dimension:     {args.vector_len}")
    print(f" Base Seed:            {args.seed}")
    print(f" DP Epsilon per Node:  {args.epsilon}")
    print(f" DP Clip Norm:         {args.clip_norm}")
    print(f" DP Noise Multiplier:  {args.noise_multiplier}")
    print("=" * 78)

    # 1. Discover or validate target round
    target_round = find_target_round(ai_engine_url, args.round_id)
    round_id = target_round["id"]
    round_number = target_round.get("round_number", "?")
    participating = target_round.get("participating_countries", countries)

    print(f"\n[ROUND TARGET]")
    print(f"  Round Number:         #{round_number}")
    print(f"  Round ID:             {round_id}")
    print(f"  Initial Status:       {target_round.get('status')}")
    print(f"  Previous Hash:        {target_round.get('previous_entry_hash')}")
    print(f"  This Hash:            {target_round.get('this_hash')}")
    print(f"  Eligible Countries:   {', '.join(participating)}")

    if target_round.get("status") in ("aggregating", "completed", "rejected"):
        print(
            f"\n[ABORT] Round {round_id} is already in '{target_round.get('status')}' state."
        )
        print("Please launch a new federated training round from the BRICS Portal.")
        sys.exit(1)

    aggregate_url = f"{ai_engine_url}/federated/aggregate"
    submission_results = []
    final_aggregation_response = None

    # 2. Iterate through member nodes and submit updates
    print("\n" + "-" * 78)
    print(" DISPATCHING SYNTHETIC LOCAL UPDATES (MEMBER ENCLAVES -> COORDINATOR)")
    print("-" * 78)

    for idx, country_code in enumerate(participating, start=1):
        weights = generate_synthetic_weights(
            args.seed, round_id, country_code, args.vector_len
        )
        sample_weights = f"[{weights[0]:.4f}, {weights[1]:.4f}, ..., {weights[-1]:.4f}] (len={len(weights)})"

        payload = {
            "round_id": round_id,
            "country_code": country_code,
            "local_weight_updates": weights,
            "clip_norm": args.clip_norm,
            "noise_multiplier": args.noise_multiplier,
            "epsilon_spent": args.epsilon,
        }

        print(f"\n[{idx}/{len(participating)}] Submitting Enclave: {country_code}")
        print(f"  Synthetic Vector:     {sample_weights}")
        print(f"  Epsilon Increment:    +{args.epsilon} eps (Clip: {args.clip_norm}, Noise: {args.noise_multiplier})")
        print(f"  Synthetic Dev Marker: synthetic_development_update = True")

        if args.dry_run:
            print("  [DRY RUN] Skipping actual POST to AI Engine.")
            continue

        try:
            resp = http_post(aggregate_url, payload)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            print(f"  [FAILED] HTTP {e.code} Error: {error_body}")
            submission_results.append(
                {
                    "country": country_code,
                    "status": f"HTTP {e.code}",
                    "detail": error_body,
                }
            )
            print(f"[ABORT] Enclave {country_code} rejected by AI Engine coordinator.")
            sys.exit(1)
        except urllib.error.URLError as e:
            print(f"  [FAILED] Connection error: {e}")
            sys.exit(1)

        status_type = resp.get("status")
        if status_type == "aggregated":
            final_aggregation_response = resp
            print(f"  [RESULT] Status:       AGGREGATED (FedAvg triggered!)")
            print(f"  [RESULT] Message:      {resp.get('message')}")
            print(f"  [RESULT] Global Model: {resp.get('global_model_version')}")
            print(f"  [RESULT] Vector Len:   {resp.get('aggregate_vector_length')}")
            print(f"  [RESULT] Submissions:  {resp.get('submissions')}/{len(participating)}")
        else:
            print(f"  [RESULT] Status:       {status_type} (DP-SGD applied)")
            print(f"  [RESULT] Submissions:  {resp.get('submissions_so_far')}/{len(participating)}")
            print(f"  [RESULT] Cumulative eps: {resp.get('cumulative_epsilon'):.4f}")

        submission_results.append(
            {
                "country": country_code,
                "status": status_type,
                "response": resp,
            }
        )

    if args.dry_run:
        print("\n[DRY RUN COMPLETE] No updates were submitted.")
        return

    # 3. Post-Aggregation Verification
    print("\n" + "=" * 78)
    print(" POST-AGGREGATION STATE VERIFICATION")
    print("=" * 78)

    # Fetch updated rounds
    try:
        updated_rounds = http_get(f"{ai_engine_url}/federated/rounds")
        round_state = next((r for r in updated_rounds if r.get("id") == round_id), None)
        if round_state:
            print(f" Round Status:         {round_state.get('status')}")
            print(f" Global Model Version: {round_state.get('global_model_version')}")
            print(f" Previous Hash:        {round_state.get('previous_entry_hash')}")
            print(f" Updated Hash:         {round_state.get('this_hash')}")
        else:
            print(f" [WARNING] Could not locate round {round_id} in rounds ledger.")
    except Exception as e:
        print(f" [WARNING] Failed to query rounds state: {e}")

    # Fetch updated nodes
    try:
        updated_nodes = http_get(f"{ai_engine_url}/federated/nodes")
        print("\n Member Node Privacy Ledger Status:")
        print(f" {'Country':<10} {'Status':<14} {'Cumulative eps':<16} {'Budget Left':<14}")
        print("-" * 54)
        for n in updated_nodes:
            if n.get("country_code") in participating:
                print(
                    f" {n.get('country_code'):<10} "
                    f"{n.get('node_status'):<14} "
                    f"{n.get('cumulative_epsilon'):<16.4f} "
                    f"{n.get('budget_remaining'):<14.4f}"
                )
    except Exception as e:
        print(f" [WARNING] Failed to query nodes state: {e}")

    # Final summary check
    print("\n" + "=" * 78)
    if final_aggregation_response and final_aggregation_response.get("status") == "aggregated":
        print(" [SUCCESS] All 5 BRICS member node updates successfully submitted.")
        print(f" [SUCCESS] AI Engine FedAvg aggregation verified: {final_aggregation_response.get('global_model_version')}")
        print("=" * 78)
    else:
        print(" [INCOMPLETE] Updates were processed but FedAvg aggregation did not trigger.")
        print("=" * 78)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Development Member-Node Simulation Runner for BRICS Federated Learning (Synthetic Data Only)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Auto-detect latest pending round and submit synthetic updates for all 5 BRICS nodes:
  python simulate_member_updates.py

  # Target a specific round ID:
  python simulate_member_updates.py --round-id 6569dfd9-7e30-4ee2-aa69-ba8b0397b075

  # Dry run (generate and display synthetic fixtures without sending HTTP requests):
  python simulate_member_updates.py --dry-run
        """,
    )
    parser.add_argument(
        "--ai-engine-url",
        default="http://localhost:5000",
        help="Base URL for the AI Engine service (default: http://localhost:5000)",
    )
    parser.add_argument(
        "--round-id",
        default=None,
        help="Target round UUID. If not specified, the latest 'pending' round is selected automatically.",
    )
    parser.add_argument(
        "--countries",
        default="IN,BR,RU,CN,ZA",
        help="Comma-separated country codes (default: IN,BR,RU,CN,ZA)",
    )
    parser.add_argument(
        "--vector-len",
        type=int,
        default=10,
        help="Length of synthetic weight vector (default: 10)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Base random seed for reproducible synthetic weights (default: 42)",
    )
    parser.add_argument(
        "--epsilon",
        type=float,
        default=0.05,
        help="Epsilon spent per member update (default: 0.05)",
    )
    parser.add_argument(
        "--clip-norm",
        type=float,
        default=1.0,
        help="DP-SGD clip norm (default: 1.0)",
    )
    parser.add_argument(
        "--noise-multiplier",
        type=float,
        default=1.1,
        help="DP-SGD noise multiplier (default: 1.1)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate synthetic weights and display payload without submitting",
    )

    args = parser.parse_args()
    run_simulation(args)


if __name__ == "__main__":
    main()
