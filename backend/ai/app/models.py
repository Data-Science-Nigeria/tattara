from enum import Enum
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class ModelPreference(str, Enum):
    gpt_4o = "gpt-4o"
    gpt_4o_mini = "gpt-4o-mini"
    gpt_5 = "gpt-5"
    groq_llama_maverick = "groq-llama-maverick"
    groq_llama_scout = "groq-llama-scout"
    groq_qwen3_32b = "groq-qwen3-32b"


class ExtractionMetrics(BaseModel):
    asr_seconds: Optional[float] = None
    vision_seconds: Optional[float] = None
    llm_seconds: Optional[float] = None
    total_seconds: Optional[float] = None
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None
    cost_usd: Optional[float] = None
    provider: Optional[str] = None
    model: Optional[str] = None


class ExtractionResponse(BaseModel):
    form_id: str
    form_version: Optional[str] = None
    extracted: Dict[str, Any] = Field(default_factory=dict)
    spans: Dict[str, Any] = Field(default_factory=dict)
    missing_required: List[str] = Field(default_factory=list)
    metrics: Optional[ExtractionMetrics] = None


class TextRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    text: str
    model_preference: Optional[ModelPreference] = None
    locale: Optional[str] = None


class AudioRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    language: Optional[str] = None
    model_preference: Optional[ModelPreference] = None


class ImageRequest(BaseModel):
    form_id: str
    form_schema: Dict[str, Any]
    use_vision: bool = True
    model_preference: Optional[ModelPreference] = None