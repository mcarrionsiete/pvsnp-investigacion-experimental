def clamp01(x):
    return max(0.0, min(1.0, x))


def compute_hardness_score(features):
    alpha_distance = features["alpha_distance"]
    pos_neg_balance = features["pos_neg_balance"]
    var_freq_std = features["var_freq_std"]
    clause_uniqueness = features["clause_uniqueness"]
    n_vars = max(features["n_vars"], 1)

    alpha_score = clamp01(1.0 - alpha_distance / 4.0)
    balance_score = clamp01(1.0 - pos_neg_balance / 0.5)
    freq_score = clamp01(var_freq_std / n_vars)
    uniqueness_score = clamp01(clause_uniqueness)

    score = (
        0.40 * alpha_score +
        0.20 * balance_score +
        0.20 * freq_score +
        0.20 * uniqueness_score
    )

    return {
        "alpha_score": alpha_score,
        "balance_score": balance_score,
        "freq_score": freq_score,
        "uniqueness_score": uniqueness_score,
        "hardness_score_v1": round(score, 6),
    }
