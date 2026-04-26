import time
from pysat.formula import CNF
from pysat.solvers import Glucose4


def run_solver(instance, solver_name="glucose4"):
    cnf = CNF()
    for clause in instance["clauses"]:
        cnf.append(clause)

    if solver_name.lower() != "glucose4":
        raise ValueError("Only glucose4 is supported in this version")

    start = time.perf_counter()
    with Glucose4(bootstrap_with=cnf.clauses) as solver:
        sat = solver.solve()
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        stats = solver.accum_stats()

    return {
        "solver_name": solver_name,
        "sat": int(bool(sat)),
        "solve_time_ms": round(elapsed_ms, 6),
        "conflicts": int(stats.get("conflicts", 0)),
        "decisions": int(stats.get("decisions", 0)),
        "propagations": int(stats.get("propagations", 0)),
    }
