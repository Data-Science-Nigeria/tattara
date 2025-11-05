from typing import Tuple
import time
from ..config import settings
import os


class SpitchService:
    """Spitch ASR + Translation helper.

    Primary path uses Spitch Python SDK (reads SPITCH_API_KEY from environment).
    Falls back to a generic HTTP endpoint if configured.
    """

    @staticmethod
    def _sdk_client():
        """Return a Spitch SDK client using configured API key; raises if unavailable."""
        # Ensure the SDK sees the key (explicit arg + env for good measure)
        if not settings.SPITCH_API_KEY:
            raise RuntimeError("SPITCH_API_KEY not configured")
        os.environ.setdefault("SPITCH_API_KEY", settings.SPITCH_API_KEY)
        # Lazy import to avoid hard dependency when not used
        from spitch import Spitch  # type: ignore
        # Pass api_key explicitly to avoid relying solely on env resolution
        return Spitch(api_key=settings.SPITCH_API_KEY)

    @staticmethod
    def transcribe(file_path: str, lang_code: str) -> Tuple[str, int]:
        """Transcribe audio using Spitch SDK only (no HTTP fallback)."""
        client = SpitchService._sdk_client()
        t0 = time.time()
        with open(file_path, "rb") as fh:
            resp = client.speech.transcribe(content=fh, language=lang_code)
        elapsed_ms = int((time.time() - t0) * 1000)
        text = getattr(resp, "text", None) or getattr(resp, "transcript", "") or ""
        return text, elapsed_ms

    @staticmethod
    def translate(text: str, source: str, target: str = "en") -> Tuple[str, int]:
        """Translate text using Spitch SDK only (no fallback). Returns (text_en, elapsed_ms)."""
        client = SpitchService._sdk_client()
        t0 = time.time()
        resp = client.text.translate(text=text, source=source, target=target)
        elapsed_ms = int((time.time() - t0) * 1000)
        text_en = getattr(resp, "text", None) or getattr(resp, "translation", "") or ""
        return text_en, elapsed_ms