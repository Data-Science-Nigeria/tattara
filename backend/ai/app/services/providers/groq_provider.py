from typing import Optional, Dict, Any, List

try:
    from groq import Groq as GroqClient
except Exception:
    GroqClient = None


class GroqProvider:
    name = "groq"
    supports_vision = False

    def __init__(self, api_key: Optional[str], model: str):
        self.model = model
        self.client = GroqClient(api_key=api_key) if (api_key and GroqClient) else None

    def complete(self, prompt: str, images: Optional[List[str]] = None, ocr_blocks: Optional[List[dict]] = None, locale: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
        if not self.client:
            return '{"_dev_note": "Groq client missing; echoing"}', {"prompt_tokens": 0, "completion_tokens": 0}

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Respond ONLY with valid JSON. No markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        text = resp.choices[0].message.content or "{}"
        usage = {
            "prompt_tokens": getattr(resp, "usage", None).prompt_tokens if getattr(resp, "usage", None) else None,
            "completion_tokens": getattr(resp, "usage", None).completion_tokens if getattr(resp, "usage", None) else None,
        }
        return text, usage
