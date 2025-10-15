from typing import Dict, Any, Optional, Tuple
from enum import Enum
from .metrics import timer, estimate_tokens
from .utils import safe_json_parse
from ..config import settings

from .providers.openai_provider import OpenAIProvider
from .providers.groq_provider import GroqProvider


class ExtractionRouter:
    def __init__(self):
        self.providers = {
            "openai": OpenAIProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL),
            "groq": GroqProvider(api_key=settings.GROQ_API_KEY, model=settings.GROQ_MODEL),
        }

        self.MODEL_MAP = {
            "gpt-4o": ("openai", settings.OPENAI_MODEL),
            "gpt-4o-mini": ("openai", "gpt-4o-mini"),
            "gpt-5": ("openai", "gpt-5"),
            "groq-llama-maverick": ("groq", settings.GROQ_MODEL),
            "groq-llama-scout": ("groq", "meta-llama/llama-4-scout-17b-16e-instruct"),
            "groq-qwen3-32b": ("groq", "qwen/qwen3-32b"),
        }

    def pick(self, preferred: Optional[str], need_vision: bool) -> Tuple[str, Optional[str]]:
        """Pick a provider name and optional model override from a preferred hint.

        preferred may be a provider name (e.g. 'openai'|'groq') or a model id
        like 'gpt-4o', 'gpt-5', 'groq-llama-4', or 'grok-deepseek-r1'. Return a tuple
        (provider_name, model_override) where model_override is None when not used.
        """
        model_hint = None
        name = settings.DEFAULT_PROVIDER
        if preferred:
            if isinstance(preferred, Enum):
                pref = str(preferred.value)
            else:
                pref = str(preferred)
            pref_l = pref.lower()
            # If the preferred matches an explicit mapping, use it
            if pref_l in self.MODEL_MAP:
                name, model_hint = self.MODEL_MAP[pref_l]
            # If the user passed a provider key directly
            elif pref_l in self.providers:
                name = pref_l
                model_hint = None
            # If the user passed a generic model id (gpt-*), treat as openai
            elif pref_l.startswith("gpt"):
                name = "openai"
                model_hint = pref
            # If user passed groq model id with 'groq' in string, route to groq
            elif "groq" in pref_l:
                name = "groq"
                model_hint = pref
                
        # Ensure vision requirement is satisfied; if not, pick a provider that supports vision
        if need_vision and not self.providers.get(name, None).supports_vision:
            for alt, p in self.providers.items():
                if p.supports_vision:
                    # drop model override when switching providers
                    return alt, None
        # Always return tuple (provider_name, model_hint)
        return name, model_hint

    def build_prompt(self, form_schema: Dict[str, Any], text_blob: str, hints: Optional[Dict[str, Any]] = None) -> str:
        examples_hint = hints.get("examples") if hints else None
        return (
            "You are an information extraction engine.\n"
            "Return ONLY a valid JSON object that matches the given form field IDs.\n"
            "Rules: No prose, no explanations, no Markdown. Keys must exactly match field 'id' values.\n"
            f"Fields schema (IDs/types/enums): {form_schema.get('fields', [])}\n"
            f"Text to extract from: \n{text_blob}\n"
            + (f"Examples: {examples_hint}\n" if examples_hint else "")
        )

    def extract(self, provider_name: str, form_schema: Dict[str, Any], text_blob: str,
                images: Optional[list[str]] = None, ocr_blocks: Optional[list[dict]] = None,
                locale: Optional[str] = None, model_override: Optional[str] = None, **kwargs) -> tuple[Dict[str, Any], Dict[str, Any], int, int, int, float, str]:
        provider = self.providers[provider_name]
        prompt = self.build_prompt(form_schema, text_blob)
        try:
            with timer() as t_llm:
                raw, usage = provider.complete(prompt=prompt, images=images or None, ocr_blocks=ocr_blocks or None, locale=locale, model=model_override)
        except Exception as e:
            # Map common provider errors to clearer responses for the API layer
            # Avoid importing fastapi here to keep this module framework-agnostic; re-raise a ValueError with message
            raise ValueError(f"LLM provider error: {e}") from e
        llm_ms = t_llm()

        try:
            data = safe_json_parse(raw)
        except Exception:
            strict_prompt = prompt + "\nRespond ONLY with JSON. If a field is unknown, put null."
            with timer() as t2:
                raw2, usage2 = provider.complete(prompt=strict_prompt, images=images or None, ocr_blocks=ocr_blocks or None, locale=locale, model=model_override)
            llm_ms += t2()
            usage = usage2 or usage
            data = safe_json_parse(raw2)

        confidence = {k: 0.8 for k in data.keys()}

        tokens_in = usage.get("prompt_tokens") or estimate_tokens(prompt)
        tokens_out = usage.get("completion_tokens") or estimate_tokens(raw)

        # Determine which model was used: prefer provider-reported model (if present in usage),
        # then explicit override (requested), then provider's default
        model_from_usage = usage.get("model") if isinstance(usage, dict) else None
        model_used = model_from_usage or model_override or getattr(provider, "model", None) or "unknown"

        # Compute cost using per-model pricing where available, otherwise use provider defaults
        model_key = (model_used or "").lower()
        pricing = None
        try:
            # exact match first
            pricing = settings.MODEL_PRICING.get(model_used) if hasattr(settings, "MODEL_PRICING") else None
            # then try normalized lowercased keys
            if pricing is None and hasattr(settings, "MODEL_PRICING"):
                for k, v in settings.MODEL_PRICING.items():
                    if k.lower() == model_key:
                        pricing = v
                        break
        except Exception:
            pricing = None

        if pricing:
            cost = (tokens_in / 1000.0) * pricing.get("input", 0.0) + (tokens_out / 1000.0) * pricing.get("output", 0.0)
        
        return data, confidence, llm_ms, tokens_in, tokens_out, cost, model_used
