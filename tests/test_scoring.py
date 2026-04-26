import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from scoring import compute_hardness_score


def _base_features(overrides=None):
    feat = {
        "alpha_distance": 0.1,
        "pos_neg_balance": 0.05,
        "var_freq_std": 2.0,
        "clause_uniqueness": 0.95,
        "n_vars": 20,
    }
    if overrides:
        feat.update(overrides)
    return feat


def test_score_range():
    score = compute_hardness_score(_base_features())
    assert 0.0 <= score["hardness_score_v1"] <= 1.0


def test_score_keys():
    score = compute_hardness_score(_base_features())
    for key in ["alpha_score", "balance_score", "freq_score", "uniqueness_score", "hardness_score_v1"]:
        assert key in score


def test_critical_alpha_higher_score():
    near_critical = compute_hardness_score(_base_features({"alpha_distance": 0.01}))
    far_from_critical = compute_hardness_score(_base_features({"alpha_distance": 3.5}))
    assert near_critical["hardness_score_v1"] > far_from_critical["hardness_score_v1"]


def test_clamp_upper_bound():
    score = compute_hardness_score(_base_features({
        "alpha_distance": 0.0,
        "pos_neg_balance": 0.0,
        "var_freq_std": 1000.0,
        "clause_uniqueness": 1.0,
    }))
    assert score["hardness_score_v1"] <= 1.0
