from collections import Counter
import numpy as np


def extract_features(instance):
    clauses = instance["clauses"]
    n_vars = instance["n_vars"]
    n_clauses = instance["n_clauses"]

    literals = [lit for clause in clauses for lit in clause]
    pos_count = sum(1 for lit in literals if lit > 0)
    neg_count = sum(1 for lit in literals if lit < 0)
    total_lits = len(literals)

    pos_ratio = pos_count / total_lits if total_lits else 0.0
    neg_ratio = neg_count / total_lits if total_lits else 0.0
    pos_neg_balance = abs(pos_ratio - neg_ratio)

    var_counts = Counter(abs(lit) for lit in literals)
    freq = np.array([var_counts.get(i, 0) for i in range(1, n_vars + 1)], dtype=float)
    var_freq_mean = float(freq.mean()) if len(freq) else 0.0
    var_freq_std = float(freq.std()) if len(freq) else 0.0
    var_freq_max = float(freq.max()) if len(freq) else 0.0

    normalized_clauses = [
        tuple(sorted(clause, key=lambda x: (abs(x), x)))
        for clause in clauses
    ]
    unique_clause_count = len(set(normalized_clauses))
    clause_uniqueness = unique_clause_count / n_clauses if n_clauses else 0.0

    alpha = instance["alpha"]
    alpha_critical = 4.267
    alpha_distance = abs(alpha - alpha_critical)

    return {
        "n_vars": n_vars,
        "n_clauses": n_clauses,
        "alpha": alpha,
        "alpha_distance": alpha_distance,
        "pos_ratio": pos_ratio,
        "neg_ratio": neg_ratio,
        "pos_neg_balance": pos_neg_balance,
        "var_freq_mean": var_freq_mean,
        "var_freq_std": var_freq_std,
        "var_freq_max": var_freq_max,
        "clause_uniqueness": clause_uniqueness,
    }
