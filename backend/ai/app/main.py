from weakref import ref
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import json, re, unicodedata
from fastapi import HTTPException
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

# Suppress pkg_resources deprecation warning emitted by some dependencies (ctranslate2)
warnings.filterwarnings(
    "ignore",
    message=r"pkg_resources is deprecated as an API.*",
    category=UserWarning,
)

app = FastAPI(title=settings.APP_NAME)

whisper_service = WhisperService()
vision_service = VisionService()
router = ExtractionRouter()

# provider instances for image forwarding (uses settings values)
default_openai_provider = OpenAIProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.APP_ENV}


@app.post("/process/text", response_model=ExtractionResponse)
async def process_text(req: TextRequest):
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


@app.post("/process/audio", response_model=ExtractionResponse)
async def process_audio(
    form_id: str = Form(...),
    form_schema: str = Form(...),  # JSON string
    language: Optional[str] = Form(None),
    provider_preference: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
):
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


@app.post("/process/image", response_model=ExtractionResponse)
async def process_image(
    form_id: str = Form(...),
    form_schema: str = Form(...),
    use_vision: bool = Form(True),
    provider_preference: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
):
    try:
        schema = json.loads(form_schema)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid form_schema JSON: {e}")

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

    # ocr_text = ocr_result.get("text") if isinstance(ocr_result, dict) else str(ocr_result or "")

    # Determine where form_schema comes from (supports both param style and old req model)
    try:
        schema_src = None
        if 'form_schema' in locals():
            schema_src = form_schema
        elif 'req' in locals():
            schema_src = getattr(ref, "form_schema", None)

        if isinstance(schema_src, dict):
            schema_obj = schema_src
        elif isinstance(schema_src, str) and schema_src.strip():
            schema_obj = json.loads(schema_src)
        else:
            raise HTTPException(status_code=400, detail="form_schema is required (JSON object or string).")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid form_schema: {e}")

    schema_obj = resolve_form_schema_from_locals(locals())

    extracted = heuristic_extract_from_text(ocr_text or "", schema_obj)

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
            m = re.search(r"[A-Za-z0-9._%+-]+@[A-ZaZ0-9.-]+\.[A-Za-z]{2,}", value)
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

def resolve_form_schema_from_locals(ns: dict) -> dict:
    """
    Accepts either:
      - form_schema as dict or JSON string param in the handler, OR
      - an older req.form_schema style (if present), OR
      - raises 400 if missing/invalid.
    """
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
