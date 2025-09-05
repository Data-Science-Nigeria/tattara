from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class ExtractionMetrics(BaseModel):
    asr_seconds: Optional[float] = 0.0
    vision_seconds: Optional[float] = 0.0
    llm_seconds: Optional[float] = 0.0
    total_seconds: Optional[float] = 0.0
    tokens_in: Optional[int] = 0
    tokens_out: Optional[int] = 0
    cost_usd: Optional[float] = 0.0
    provider: Optional[str] = None
    model: Optional[str] = None


class ExtractionResponse(BaseModel):
    form_id: str
    form_version: Optional[int] = None
    extracted: Dict[str, Any]
    confidence: Dict[str, float] = Field(default_factory=dict)
    spans: Dict[str, Any] = Field(default_factory=dict)
    missing_required: List[str] = Field(default_factory=list)
    metrics: ExtractionMetrics


class TextRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    text: str
    provider_preference: Optional[str] = None  # openai|groq
    hints: Optional[Dict[str, Any]] = None
    locale: Optional[str] = None


class AudioRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    language: Optional[str] = None
    provider_preference: Optional[str] = None


class ImageRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    use_vision: bool = True
    provider_preference: Optional[str] = None
