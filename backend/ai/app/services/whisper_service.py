from typing import Optional
from .metrics import timer
from ..config import settings

try:
    from openai import OpenAI as OpenAIClient
except Exception:
    OpenAIClient = None

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None


class WhisperService:
    def __init__(self):
        self.mode = settings.WHISPER_MODE
        self._openai = None
        self._local = None
        if self.mode == "api" and settings.OPENAI_API_KEY and OpenAIClient:
            self._openai = OpenAIClient(api_key=settings.OPENAI_API_KEY)
        elif self.mode == "local" and WhisperModel:
            self._local = WhisperModel("base", compute_type="int8")

    def transcribe(self, file_path: str, language: Optional[str] = None) -> tuple[str, int]:
        with timer() as t:
            if self.mode == "api" and self._openai:
                with open(file_path, "rb") as f:
                    resp = self._openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        language=language,
                        response_format="text",
                    )
                text = str(resp)
            elif self.mode == "local" and self._local:
                segments, _ = self._local.transcribe(file_path, language=language)
                text = " ".join([s.text for s in segments])
            else:
                raise RuntimeError("WhisperService not configured or dependencies missing")
            return text, t()
