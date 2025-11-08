from time import perf_counter
from contextlib import contextmanager


@contextmanager
def timer():
    start = perf_counter()
    yield lambda: int((perf_counter() - start) * 1000)  # ms


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, int(len(text) / 4))
