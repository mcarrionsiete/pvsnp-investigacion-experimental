import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from generator import generate_random_3sat
from features import extract_features
from scoring import compute_hardness_score
from benchmark import run_solver
from export import save_results


def build_row(instance_id, n_vars, alpha, seed):
    instance = generate_random_3sat(n_vars=n_vars, alpha=alpha, seed=seed)
    features = extract_features(instance)
    score = compute_hardness_score(features)
    bench = run_solver(instance)

    row = {
        "instance_id": instance_id,
        "seed": seed,
        **features,
        **score,
        **bench,
    }
    return row


def main():
    rows = []
    configs = [
        (20, 3.5),
        (20, 4.2),
        (20, 4.267),
        (20, 4.3),
        (20, 5.0),
        (50, 4.2),
        (50, 4.267),
        (50, 4.3),
        (100, 4.2),
        (100, 4.267),
        (100, 4.3),
    ]

    instance_counter = 0
    for n_vars, alpha in configs:
        for seed in range(10):
            instance_id = f"inst_{instance_counter:05d}"
            row = build_row(instance_id, n_vars, alpha, seed)
            rows.append(row)
            instance_counter += 1

    df = save_results(rows, "results/runs/mvp_run.csv")
    print("\n=== First rows ===")
    print(df.head())
    print("\n=== Correlation: hardness_score_v1 vs solver metrics ===")
    print(df[["hardness_score_v1", "solve_time_ms", "conflicts", "decisions"]].corr())
    print(f"\nDataset saved: {len(df)} instances")


if __name__ == "__main__":
    main()
