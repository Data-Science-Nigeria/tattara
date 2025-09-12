from typing import Optional, Dict, Any, List
import base64

try:
    from openai import OpenAI as OpenAIClient
except Exception:
    OpenAIClient = None


class OpenAIProvider:
    name = "openai"
    supports_vision = True  # allow vision path

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
        if not self.client:
            return {"text": "", "blocks": [], "_error": "openai client not initialized"}

        fn = filename.lower()
        mime = "image/jpeg" if fn.endswith((".jpg", ".jpeg")) else "image/png"
        data_url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode('ascii')}"

        content = [
            {"type": "image_url", "image_url": {"url": data_url}},
            {"type": "text", "text": "Transcribe all visible text. Return plain text only, no JSON."},
        ]
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an OCR assistant. Return only raw text."},
                    {"role": "user", "content": content},
                ],
                temperature=0.0,
            )
            text = resp.choices[0].message.content or ""
            return {"text": text}
        except Exception as e:
            return {"text": "", "_error": f"{type(e).__name__}: {e}"}
