import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from generator import generate_random_3sat


def test_basic_structure():
    inst = generate_random_3sat(20, 4.2, seed=1)
    assert inst["n_vars"] == 20
    assert len(inst["clauses"]) == inst["n_clauses"]
    assert all(len(c) == 3 for c in inst["clauses"])


def test_reproducibility():
    inst1 = generate_random_3sat(20, 4.2, seed=42)
    inst2 = generate_random_3sat(20, 4.2, seed=42)
    assert inst1["clauses"] == inst2["clauses"]


def test_alpha_ratio():
    inst = generate_random_3sat(30, 4.267, seed=0)
    assert abs(inst["alpha"] - 4.267) < 0.1


def test_variable_bounds():
    inst = generate_random_3sat(20, 4.0, seed=7)
    for clause in inst["clauses"]:
        for lit in clause:
            assert 1 <= abs(lit) <= 20
