import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from generator import generate_random_3sat
from features import extract_features


def test_features_keys():
    inst = generate_random_3sat(20, 4.2, seed=1)
    feat = extract_features(inst)
    required_keys = [
        "n_vars", "n_clauses", "alpha", "alpha_distance",
        "pos_ratio", "neg_ratio", "pos_neg_balance",
        "var_freq_mean", "var_freq_std", "var_freq_max",
        "clause_uniqueness"
    ]
    for key in required_keys:
        assert key in feat, f"Missing key: {key}"


def test_clause_uniqueness_range():
    inst = generate_random_3sat(20, 4.2, seed=5)
    feat = extract_features(inst)
    assert 0.0 <= feat["clause_uniqueness"] <= 1.0


def test_pos_neg_balance_range():
    inst = generate_random_3sat(30, 4.267, seed=0)
    feat = extract_features(inst)
    assert 0.0 <= feat["pos_neg_balance"] <= 1.0


def test_alpha_distance_positive():
    inst = generate_random_3sat(20, 4.2, seed=3)
    feat = extract_features(inst)
    assert feat["alpha_distance"] >= 0.0
