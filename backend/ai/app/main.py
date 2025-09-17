from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import json, re, unicodedata
from typing import Optional, List, Dict, Any
import tempfile
from .config import settings
from .models import TextRequest, ExtractionResponse, ExtractionMetrics
from .services.whisper_service import WhisperService
from .services.vision_service import VisionService
from .services.extraction_router import ExtractionRouter
from .services.validator import SchemaValidator
from .services.providers.openai_provider import OpenAIProvider
import warnings
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

# Suppress pkg_resources deprecation warning emitted by some dependencies (ctranslate2)
warnings.filterwarnings(
    "ignore",
    message=r"pkg_resources is deprecated as an API.*",
    category=UserWarning,
)

# Create the app with nice metadata (shows on Swagger)
app = FastAPI(
    title="Tattara AI API",
    version="1.0.0",
    description="AI endpoints for text, audio and image extraction using LLMs, Whisper and Vision Services, and OCR heuristics.",
    contact={"name": "DSN Team", "url": "https://datasciencenigeria.org"},
    license_info={"name": "Proprietary"},
)

# CORS (optional for local/frontend testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redirect root to Swagger UI
@app.get("/", include_in_schema=False)
def index():
    """
    API Root: returns a brief welcome and helpful URLs.
    """
    version = getattr(settings, "APP_VERSION", "1.0.0")
    return {
        "message": "Welcome to Tattara AI API",
        "version": version,
        "docs_url": "/docs",
        "health_url": "/health",
    }

@app.get("/health", tags=["Utility"])
def health():
    """Simple health check."""
    return {"status": "ok"}

whisper_service = WhisperService()
vision_service = VisionService()
router = ExtractionRouter()

# provider instances for image forwarding (uses settings values)
default_openai_provider = OpenAIProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)


@app.post(
    "/process/text",
    response_model=ExtractionResponse,
    response_model_exclude_none=True,
    tags=["AI"],
)
async def process_text(req: TextRequest):
    """
    Extract Structured Fields from Raw Text

    Overview:
    - Parses free-form text and maps values to your form schema fields.
    - Uses LLM plus lightweight heuristics to improve accuracy for common fields.

    Request:
    - form_id: Identifier of your form/template.
    - form_schema: JSON object with "fields" (id, type, required).
    - text: The raw text to analyze.
    - provider_preference: Optional provider hint (e.g., "openai").

    Process:
    1. Validate schema.
    2. Run extraction with the configured model.
    3. Apply heuristics for:
       - First name / Last name
       - Email
       - Age
       - Comments/Notes

    Returns:
    - extracted: Dict of field_id -> value
    - missing_required: List of missing required fields
    - metrics: Timing/cost/model metadata

    Error Handling:
    - 400 for invalid schema
    - 502 for provider errors
    """
    need_vision = False
    provider_name = router.pick(req.provider_preference, need_vision)

    try:
        data, confidence, llm_ms, tokens_in, tokens_out, cost, model = (
            router.extract(
                provider_name=provider_name,
                form_schema=req.form_schema,
                text_blob=req.text,
                images=None,
                ocr_blocks=None,
                locale=req.locale,
            )
        )
    except ValueError as e:
        # Surface provider errors as 502 Bad Gateway with helpful message
        raise HTTPException(status_code=502, detail=str(e))

    validator = SchemaValidator(req.form_schema)
    missing = validator.validate_and_report(data)

    metrics = ExtractionMetrics(
        asr_seconds=round(0 / 1000, 2),
        vision_seconds=round(0 / 1000, 2),
        llm_seconds=round(llm_ms / 1000, 2) if llm_ms is not None else None,
        total_seconds=round(llm_ms / 1000, 2) if llm_ms is not None else None,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=round(cost, 6),
        provider=provider_name,
        model=model,
    )

    return ExtractionResponse(
        form_id=req.form_id,
        extracted=data,
        confidence=confidence,
        spans={},
        missing_required=missing,
        metrics=metrics,
    )


@app.post(
    "/process/audio",
    response_model=ExtractionResponse,
    response_model_exclude_none=True,
    tags=["AI"],
)
async def process_audio(
    form_id: str = Form(...),
    form_schema: str = Form(...),  # JSON string
    language: Optional[str] = Form(None),
    provider_preference: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
):
    """
    Audio Transcription and Form Extraction

    Overview:
    - Upload an audio file (WAV/MP3) for transcription.
    - Extracts structured data using your form schema.

    Request (multipart/form-data):
    - form_id: Your form identifier.
    - form_schema: JSON string of the fields object:
      {
        "fields": [
          {"id":"first_name","type":"string"},
          {"id":"last_name","type":"string"},
          {"id":"email","type":"string"},
          {"id":"age","type":"integer"},
          {"id":"comments","type":"string"}
        ]
      }
    - language: Optional language code (e.g., "en", "fr").
    - provider_preference: e.g., "openai".
    - audio_file: The audio file to transcribe (WAV/MP3).

    Process:
    1. Parse and validate form_schema.
    2. Transcribe audio to text using Whisper ASR.
    3. Run extraction on the transcribed text with the configured model.
    4. Apply heuristics for common fields (e.g., name, email).

    Returns:
    - extracted: Filled fields
    - missing_required: Any required but missing fields
    - metrics: ASR/LLM timings and model info

    Errors:
    - 400: Invalid form_schema or audio file
    - 502: Transcription/provider error (with details)
    """
    try:
        schema = json.loads(form_schema)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid form_schema JSON: {e}")

    suffix = f"_{audio_file.filename}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio_file.read()
        tmp.write(content)
        tmp_path = tmp.name

    transcript, asr_ms = whisper_service.transcribe(tmp_path, language=language)

    provider_name = router.pick(provider_preference, need_vision=False)

    data, confidence, llm_ms, tokens_in, tokens_out, cost, model = (
        router.extract(
            provider_name=provider_name,
            form_schema=schema,
            text_blob=transcript,
            images=None,
            ocr_blocks=None,
            locale=None,
        )
    )

    validator = SchemaValidator(schema)
    missing = validator.validate_and_report(data)

    total_ms = asr_ms + llm_ms

    metrics = ExtractionMetrics(
        asr_seconds=round(asr_ms / 1000, 2) if asr_ms is not None else None,
        vision_seconds=round(0 / 1000, 2),
        llm_seconds=round(llm_ms / 1000, 2) if llm_ms is not None else None,
        total_seconds=round(total_ms / 1000, 2) if total_ms is not None else None,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=round(cost, 6),
        provider=provider_name,
        model=model,
    )

    return ExtractionResponse(
        form_id=form_id,
        extracted=data,
        confidence=confidence,
        spans={},
        missing_required=missing,
        metrics=metrics,
    )


@app.post(
    "/process/image",
    response_model=ExtractionResponse,
    response_model_exclude_none=True,
    tags=["AI"],
)
async def process_image(
    form_id: str = Form(...),
    form_schema: str = Form(...),
    use_vision: bool = Form(True),
    provider_preference: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
):
    """
    OCR + Form Extraction from Images

    Overview:
    - Accepts one or more PNG/JPEG files.
    - Uses a vision-capable model (e.g., gpt-4o) to transcribe text.
    - Applies heuristics to populate common fields reliably.

    Request (multipart/form-data):
    - form_id: Your form identifier.
    - form_schema: JSON string of the fields object:
      {
        "fields": [
          {"id":"first_name","type":"string"},
          {"id":"last_name","type":"string"},
          {"id":"email","type":"string"},
          {"id":"age","type":"integer"},
          {"id":"comments","type":"string"}
        ]
      }
    - use_vision: true/false (true recommended).
    - provider_preference: e.g., "openai".
    - images: One or more PNG/JPEG files.

    Process:
    1. Parse and validate form_schema.
    2. OCR each image via the configured provider.
    3. Combine text and apply heuristics for:
       - First name / Surname (supports variants: given name, family name)
       - Email (regex validated)
       - Age (integers)
       - Comments/Notes

    Returns:
    - extracted: Filled fields
    - missing_required: Any required but missing fields
    - metrics: Vision/LLM timings and model info

    Errors:
    - 400: Invalid form_schema
    - 502: OCR/provider error (with details)
    """
    # Single source of truth for schema parsing
    schema = resolve_form_schema_from_locals(locals())

    ocr_texts = []
    all_blocks = []
    vision_ms_total = 0

    temp_paths = []
    for img in images:
        suffix = f"_{img.filename}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await img.read()
            tmp.write(content)
            temp_paths.append(tmp.name)

    for p in temp_paths:
        ocr_text, blocks, vision_ms = vision_service.ocr(p, provider_client=default_openai_provider)
        ocr_texts.append(ocr_text)
        all_blocks.extend(blocks)
        vision_ms_total += vision_ms

    text_blob = "\n".join(ocr_texts)
    ocr_text = text_blob  # define for heuristic use

    provider_name = router.pick(provider_preference, need_vision=use_vision)
    data, confidence, llm_ms, tokens_in, tokens_out, cost, model = (
        router.extract(
            provider_name=provider_name,
            form_schema=schema,
            text_blob=text_blob,
            images=None,
            ocr_blocks=all_blocks,
            locale=None,
        )
    )

    validator = SchemaValidator(schema)
    missing = validator.validate_and_report(data)

    total_ms = vision_ms_total + llm_ms

    metrics = ExtractionMetrics(
        asr_seconds=round(0 / 1000, 2),
        vision_seconds=round(vision_ms_total / 1000, 2) if vision_ms_total is not None else None,
        llm_seconds=round(llm_ms / 1000, 2) if llm_ms is not None else None,
        total_seconds=round(total_ms / 1000, 2) if total_ms is not None else None,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=round(cost, 6),
        provider=provider_name,
        model=model,
    )

    # Heuristic extraction from OCR text
    extracted = heuristic_extract_from_text(ocr_text or "", schema)

    return ExtractionResponse(
        form_id=form_id,
        form_version=None,
        extracted=extracted,
        confidence={k: 0.8 for k in extracted.keys()},
        spans={},
        missing_required=[],
        metrics=metrics,
    )


def _norm_line(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    return s.lstrip("•·-—–*☒☐✓✔✗[]() \t").strip()

def heuristic_extract_from_text(text: str, form_schema: dict) -> dict:
    fields = {f["id"]: (None if f.get("type") == "integer" else "") for f in form_schema.get("fields", [])}
    for raw in text.splitlines():
        line = _norm_line(raw)
        if not line or ":" not in line:
            continue
        key, value = [p.strip() for p in line.split(":", 1)]
        if not value:
            continue
        k = key.lower()
        if ("first name" in k or "firstname" in k or "given name" in k) and "first_name" in fields:
            fields["first_name"] = value.split()[0]
        elif ("surname" in k or "last name" in k or "lastname" in k or "family name" in k) and "last_name" in fields:
            fields["last_name"] = value.split()[-1]
        elif k.startswith("email") and "email" in fields:
            m = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", value)
            if m:
                fields["email"] = m.group(0)
        elif k.startswith("age") and "age" in fields:
            m = re.search(r"\d{1,3}", value)
            if m:
                fields["age"] = int(m.group(0))
        elif (k.startswith("comments") or k.startswith("note")) and "comments" in fields:
            fields["comments"] = value
    if ("first_name" in fields and "last_name" in fields) and (not fields["first_name"] or not fields["last_name"]):
        m = re.search(r"\bName\s*:\s*([A-Za-z]+)\s+([A-Za-z]+)", text, re.IGNORECASE)
        if m:
            fields["first_name"] = fields.get("first_name") or m.group(1)
            fields["last_name"] = fields.get("last_name") or m.group(2)
    return fields

# Helper (ensure this exists once near the top of main.py)
def resolve_form_schema_from_locals(ns: dict) -> dict:
    cand = ns.get("form_schema")
    if cand is None and "req" in ns:
        cand = getattr(ns["req"], "form_schema", None)
    if isinstance(cand, dict):
        return cand
    if isinstance(cand, str):
        try:
            return json.loads(cand)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid form_schema JSON: {e}")
    raise HTTPException(status_code=400, detail="form_schema is required (JSON object or string).")
