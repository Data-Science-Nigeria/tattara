from typing import Optional, Dict, Any, List
import base64

try:
    from openai import OpenAI as OpenAIClient
except Exception:
    OpenAIClient = None


class OpenAIProvider:
    name = "openai"
    supports_vision = True

    def __init__(self, api_key: Optional[str], model: str):
        self.model = model
        self.client = OpenAIClient(api_key=api_key) if (api_key and OpenAIClient) else None

    def complete(self, prompt: str, images: Optional[List[str]] = None, ocr_blocks: Optional[List[dict]] = None, locale: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
        if not self.client:
            return '{"_dev_note": "OpenAI client missing; echoing"}', {"prompt_tokens": 0, "completion_tokens": 0}

        content = [{"type": "text", "text": prompt}]
        if images:
            for url in images:
                content.append({"type": "image_url", "image_url": {"url": url}})
        if ocr_blocks:
            content.append({"type": "text", "text": f"OCR blocks: {ocr_blocks[:10]}"})

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Respond ONLY with valid JSON. No markdown."},
                {"role": "user", "content": content},
            ],
            temperature=1,
        )
        text = resp.choices[0].message.content or "{}"
        usage = {
            "prompt_tokens": getattr(resp, "usage", None).prompt_tokens if getattr(resp, "usage", None) else None,
            "completion_tokens": getattr(resp, "usage", None).completion_tokens if getattr(resp, "usage", None) else None,
        }
        return text, usage

    def process_image(self, image_bytes: bytes, filename: str) -> Dict[str, Any] | str:
        """Basic adapter to send image bytes to OpenAI by embedding base64 in the prompt.

        This is a fallback approach for providers that don't expose a direct image-processing SDK
        in this codebase. It's not optimal for large images. For production, replace with
        provider-native file upload or multimodal API call.
        """
        if not self.client:
            return {"text": "", "blocks": []}

        b64 = base64.b64encode(image_bytes).decode("ascii")
        # keep prompt reasonably small by trimming base64 (provider may still accept large input)
        preview = b64[:4096]

        prompt = (
            "You are an OCR assistant. Extract all text from the provided base64-encoded image data. "
            "Respond with JSON: {\"text\": <full_text> , \"blocks\": [ {\"text\": ..., \"bbox\": [x,y,w,h], \"confidence\": 0.9}, ... ] }\n"
            f"Image filename: {filename}\n"
            f"Base64 (truncated preview): {preview}"
        )

        text, usage = self.complete(prompt)

        # Try to parse returned text as JSON; fallback to returning text blob
        try:
            import json

            parsed = json.loads(text)
            return parsed
        except Exception:
            return text
