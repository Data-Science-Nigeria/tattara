from typing import Any, Dict, TypedDict


JsonDict = Dict[str, Any]


class OCRBlock(TypedDict, total=False):
    text: str
    bbox: tuple[int, int, int, int]
    confidence: float
