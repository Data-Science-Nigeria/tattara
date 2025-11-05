from typing import Optional, Tuple, Dict, Any
from .extraction_router import ExtractionRouter


class TranslationService:
    """Translate arbitrary language text to English using the selected LLM provider/model.

    Uses the same provider.complete interface as ExtractionRouter providers.
    """

    def __init__(self, router: ExtractionRouter) -> None:
        self.router = router

    def translate_to_english(
        self,
        text: str,
        provider_name: str,
        model_override: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        provider = self.router.providers[provider_name]
        prompt = (
            "You are a professional translator. Translate the following text to English.\n"
            "Return only the translation, no extra commentary or formatting.\n\n"
            f"Text:\n{text}"
        )
        translated, usage = provider.complete(prompt=prompt, images=None, ocr_blocks=None, locale=None, model=model_override)
        return (translated or "").strip(), (usage or {})
