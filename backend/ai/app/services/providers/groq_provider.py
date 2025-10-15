from typing import Optional, Dict, Any, List

try:
    from groq import Groq as GroqClient
except Exception:
    GroqClient = None


class GroqProvider:
    name = "groq"
    # Advertise vision support so image pipelines may keep Groq as the chosen provider
    supports_vision = True

    def __init__(self, api_key: Optional[str], model: str):
        self.model = model
        self.client = GroqClient(api_key=api_key) if (api_key and GroqClient) else None

    def complete(self, prompt: str, images: Optional[List[str]] = None, ocr_blocks: Optional[List[dict]] = None, locale: Optional[str] = None, model: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
        model_used = model or self.model
        if not self.client:
            return '{"_dev_note": "Groq client missing; echoing"}', {"prompt_tokens": 0, "completion_tokens": 0, "model": model_used}

        # Build a single string message. The Groq client expects message content to be a string
        # so we embed image data URLs and OCR blocks as plain text appended to the prompt.
        parts = [prompt]
        if images:
            for i, url in enumerate(images[:10], start=1):
                parts.append(f"[IMAGE {i}]: {url}")
        if ocr_blocks:
            try:
                # include a compact representation of the first few OCR blocks
                import json

                parts.append("OCR_BLOCKS:")
                parts.append(json.dumps(ocr_blocks[:10], default=str))
            except Exception:
                parts.append("OCR blocks present.")

        content_str = "\n\n".join(parts)

        resp = self.client.chat.completions.create(
            model=model_used,
            messages=[
                {"role": "system", "content": "Respond ONLY with valid JSON. No markdown."},
                {"role": "user", "content": content_str},
            ],
            temperature=0,
        )
        text = resp.choices[0].message.content or "{}"
        model_from_resp = None
        try:
            model_from_resp = getattr(resp, "model", None)
        except Exception:
            model_from_resp = None
        model_final = model_from_resp or model_used
        usage = {
            "prompt_tokens": getattr(resp, "usage", None).prompt_tokens if getattr(resp, "usage", None) else None,
            "completion_tokens": getattr(resp, "usage", None).completion_tokens if getattr(resp, "usage", None) else None,
            "model": model_final,
        }
        return text, usage
