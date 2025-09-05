from typing import List
from pathlib import Path
from PIL import Image, ImageOps
from .metrics import timer
from ..schemas import OCRBlock
import base64


class VisionService:
    """Forward images to a provider for processing.

    This implementation does NOT run local OCR. Callers must supply a
    provider client that exposes a `process_image(image_bytes: bytes, filename: str)`
    method which returns either a dict {"text": str, "blocks": [...]}
    or a plain string (interpreted as full text).
    """

    def ocr(self, img_path: str, provider_client) -> tuple[str, List[OCRBlock], int]:
        """Send image bytes to provider_client.process_image and normalize response.

        Returns: (ocr_text, blocks, elapsed_ms)
        """
        if provider_client is None:
            raise ValueError("provider_client is required for remote image processing")

        with timer() as t:
            with open(img_path, "rb") as fh:
                img_bytes = fh.read()

            # Provider adapter: delegate to provider_client
            resp = provider_client.process_image(img_bytes, filename=Path(img_path).name)

            # Normalize provider response
            if isinstance(resp, dict):
                text = resp.get("text", "")
                blocks = resp.get("blocks", [])
            else:
                text = str(resp)
                blocks = []

            return text, blocks, t()
