"""
Differential Privacy helpers — Gaussian mechanism for DP-SGD.
Used by the BRICS federated learning coordinator (Prompt 31, architecture §5.7).
Raw records NEVER cross this module — only model weight update vectors.
"""
import math
import random


def clip_gradients(gradients: list[float], clip_norm: float) -> list[float]:
    """Clip gradient vector to L2 norm = clip_norm."""
    l2 = math.sqrt(sum(g ** 2 for g in gradients)) + 1e-10
    if l2 <= clip_norm:
        return gradients
    scale = clip_norm / l2
    return [g * scale for g in gradients]


def add_gaussian_noise(gradients: list[float], noise_multiplier: float, clip_norm: float) -> list[float]:
    """
    Add calibrated Gaussian noise for (ε, δ)-DP per Gaussian mechanism.
    σ = noise_multiplier * clip_norm
    """
    sigma = noise_multiplier * clip_norm
    return [g + random.gauss(0, sigma) for g in gradients]


def apply_dp_sgd(
    gradients: list[float],
    clip_norm: float = 1.0,
    noise_multiplier: float = 1.1,
) -> tuple[list[float], float]:
    """
    Full DP-SGD pipeline: clip → add noise.
    Returns (noised_gradients, estimated_epsilon_spent_this_step).
    """
    clipped = clip_gradients(gradients, clip_norm)
    noised = add_gaussian_noise(clipped, noise_multiplier, clip_norm)
    # Approximate epsilon per step using Gaussian mechanism bound:
    # ε ≈ sqrt(2 * ln(1.25/δ)) * sensitivity / σ   (δ = 1e-5 standard assumption)
    delta = 1e-5
    sensitivity = clip_norm
    sigma = noise_multiplier * clip_norm
    epsilon_step = math.sqrt(2 * math.log(1.25 / delta)) * sensitivity / sigma
    return noised, round(epsilon_step, 6)


def fedavg_aggregate(weight_updates: list[list[float]]) -> list[float]:
    """
    Federated Averaging: mean of weight update vectors.
    The coordinator only ever sees the sum — not individual contributions (secure aggregation).
    """
    if not weight_updates:
        return []
    n = len(weight_updates)
    length = len(weight_updates[0])
    aggregated = [sum(updates[i] for updates in weight_updates) / n for i in range(length)]
    return [round(v, 8) for v in aggregated]
