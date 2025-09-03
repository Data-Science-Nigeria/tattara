from typing import Dict, Any, Optional
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

    def pick(self, preferred: Optional[str], need_vision: bool) -> str:
        if preferred in self.providers:
            name = preferred
        else:
            name = settings.DEFAULT_PROVIDER
        if need_vision and not self.providers[name].supports_vision:
            for alt, p in self.providers.items():
                if p.supports_vision:
                    return alt
        return name

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
                locale: Optional[str] = None) -> tuple[Dict[str, Any], Dict[str, Any], int, int, int, float, str]:
        provider = self.providers[provider_name]
        prompt = self.build_prompt(form_schema, text_blob)
        try:
            with timer() as t_llm:
                raw, usage = provider.complete(prompt=prompt, images=images or None, ocr_blocks=ocr_blocks or None, locale=locale)
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
                raw2, usage2 = provider.complete(prompt=strict_prompt, images=images or None, ocr_blocks=ocr_blocks or None, locale=locale)
            llm_ms += t2()
            usage = usage2 or usage
            data = safe_json_parse(raw2)

        confidence = {k: 0.8 for k in data.keys()}

        tokens_in = usage.get("prompt_tokens") or estimate_tokens(prompt)
        tokens_out = usage.get("completion_tokens") or estimate_tokens(raw)

        if provider_name == "openai":
            cost = (tokens_in/1000.0)*settings.PRICE_OPENAI_PER_1K_INPUT + (tokens_out/1000.0)*settings.PRICE_OPENAI_PER_1K_OUTPUT
            model = settings.OPENAI_MODEL
        else:
            cost = (tokens_in/1000.0)*settings.PRICE_GROQ_PER_1K_INPUT + (tokens_out/1000.0)*settings.PRICE_GROQ_PER_1K_OUTPUT
            model = settings.GROQ_MODEL

        return data, confidence, llm_ms, tokens_in, tokens_out, cost, model
