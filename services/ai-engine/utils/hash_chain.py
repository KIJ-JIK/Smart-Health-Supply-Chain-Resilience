"""
SHA-256 hash-chaining for federation rounds and audit log integrity.
Every round's hash includes: id, round_number, status, previous_entry_hash.
(Prompt 31, masterplan §64 — every model version must be backtestable and auditable.)
"""
import hashlib
import json


GENESIS_HASH = "0" * 64  # 64-zero genesis anchor (matches backend TypeScript implementation)


def compute_round_hash(
    round_id: str,
    round_number: int,
    status: str,
    previous_entry_hash: str,
) -> str:
    """
    Compute SHA-256 hash for a federation round entry.
    this_hash = SHA256(id || round_number || status || previous_entry_hash)
    """
    payload = json.dumps(
        {
            "id": round_id,
            "round_number": round_number,
            "status": status,
            "previous_entry_hash": previous_entry_hash,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def verify_chain(rounds: list[dict]) -> bool:
    """
    Verify the integrity of a sequence of rounds.
    Returns True if the hash chain is unbroken.
    """
    expected_prev = GENESIS_HASH
    for r in sorted(rounds, key=lambda x: x["round_number"]):
        if r["previous_entry_hash"] != expected_prev:
            return False
        computed = compute_round_hash(
            r["id"], r["round_number"], r["status"], r["previous_entry_hash"]
        )
        if computed != r["this_hash"]:
            return False
        expected_prev = r["this_hash"]
    return True
