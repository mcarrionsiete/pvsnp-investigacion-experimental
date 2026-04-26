import random


def generate_random_3sat(n_vars, alpha, seed=None):
    rng = random.Random(seed)
    n_clauses = max(1, int(round(alpha * n_vars)))
    clauses = []

    for _ in range(n_clauses):
        vars_sample = rng.sample(range(1, n_vars + 1), 3)
        clause = []
        for v in vars_sample:
            sign = rng.choice([1, -1])
            clause.append(sign * v)
        clauses.append(clause)

    return {
        "n_vars": n_vars,
        "n_clauses": n_clauses,
        "alpha": n_clauses / n_vars,
        "clauses": clauses,
        "seed": seed,
    }
