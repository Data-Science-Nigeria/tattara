from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional, List
import json
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

    return ExtractionResponse(
        form_id=form_id,
        extracted=data,
        confidence=confidence,
        spans={},
        missing_required=missing,
        metrics=metrics,
    )
