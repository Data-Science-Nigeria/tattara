from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
import json, re, unicodedata
from typing import Optional, List, Dict, Any
import tempfile
from .config import settings
from .models import TextRequest, ExtractionResponse, ExtractionMetrics, ModelPreference, LanguagePreference
from .services.whisper_service import WhisperService
from .services.spitch_service import SpitchService
from .services.translation_service import TranslationService
from .services.vision_service import VisionService
from .services.extraction_router import ExtractionRouter
from .services.validator import SchemaValidator
from .services.providers.openai_provider import OpenAIProvider
import warnings
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from .utils.schema import ensure_demo_schema, BadFormSchema
from datetime import datetime 
from .utils.prompting import build_extraction_header

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
translator = TranslationService(router)

# provider instances for image forwarding (uses settings values)
default_openai_provider = OpenAIProvider(api_key=settings.OPENAI_API_KEY, model=settings.OPENAI_MODEL)


@app.post("/process/text", response_model=ExtractionResponse, response_model_exclude_none=True, tags=["AI"])
async def process_text(req: TextRequest, model_preference: Optional[ModelPreference] = Query(None)):
    """
    Extract Structured Fields from Raw Text

    Overview:
    - Parses free-form text and maps values to your form schema fields.
    - Uses LLM plus lightweight heuristics to improve accuracy for common fields.

    Request:
    - form_id: Identifier of your form/template.
    - form_schema: JSON object with "fields" (id, type, required).
    - text: The raw text to analyze.
    - model_preference: Optional model hint (e.g., "gpt-4o").

    Demo Form:

        {
            "form_id": "demo_form1",
            "form_schema": {
                "fields": [
                { "id": "patientName", "type": "text", "required": true },
                { "id": "patientAge", "type": "number", "required": true },
                { "id": "patientGender", "type": "select", "required": true },
                { "id": "symptomsDate", "type": "date", "required": true },
                { "id": "reportedSymptoms", "type": "multiselect", "required": false },
                { "id": "testResult", "type": "select", "required": true },
                { "id": "treatmentProvided", "type": "select", "required": false },
                { "id": "healthWorkerId", "type": "text", "required": true },
                { "id": "location", "type": "text", "required": true },
                { "id": "followUpRequired", "type": "boolean", "required": false },
                { "id": "notes", "type": "textarea", "required": false }
                ]
            },
            "text": "The patient name is Janet Yakubu. She is a 29-year-old trader, who was seen at Ketu Clinic, Lagos on 2025-09-21 with fever, headache, and cough; the rapid test result was Positive, treatment provided included paracetamol and rest, attended by health worker ID HW-9321; follow-up is required; notes: patient stable and asked to return in 3 days.",
            "provider_preference": null,
            "model_preference": null
        }


    Process:
    1. Validate schema.
    2. Run extraction with the configured model.
    3. Apply heuristics for:
       - patientName, patientAge, patientGender, symptomsDate
       - reportedSymptoms, testResult, treatmentProvided
       - healthWorkerId, location, followUpRequired, notes

    Returns:
    - extracted: Dict of field_id -> value
    - missing_required: List of missing required fields
    - metrics: Timing/cost/model metadata

    Error Handling:
    - 400 for invalid schema
    - 502 for provider errors
    """
    need_vision = False
    # Prefer an explicit query-selection over the body value when provided
    preferred = model_preference or req.model_preference
    _pick = router.pick(preferred, need_vision)
    if isinstance(_pick, tuple):
        provider_name, model_override = _pick
    else:
        provider_name = _pick
        model_override = None

    # Coerce/validate form_schema to the demo_form1 shape
    try:
        schema = ensure_demo_schema(req.form_schema)
    except BadFormSchema as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
            provider_name=provider_name,
            form_schema=schema,
            text_blob=req.text,
            images=None,
            ocr_blocks=None,
            locale=None,
            model_override=model_override,
        )
    except TypeError as e:
        # Running process may have an older in-memory ExtractionRouter.extract that
        # doesn't accept model_override (dev reloader inconsistencies). Retry without
        # the kwarg to preserve service availability during reloads.
        if "model_override" in str(e):
            data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
                provider_name=provider_name,
                form_schema=schema,
                text_blob=req.text,
                images=None,
                ocr_blocks=None,
                locale=None,
            )
        else:
            raise HTTPException(status_code=502, detail=f"Extraction error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Extraction error: {e}")

    # Heuristic fallback/merge for the medical schema
    heur = heuristic_extract_from_text(req.text or "", schema)
    if not isinstance(data, dict):
        data = {}
    for k, v in heur.items():
        if k not in data or data[k] in (None, "", [], {}):
            data[k] = v

    validator = SchemaValidator(schema)
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
    language: LanguagePreference = Form(LanguagePreference.English, description="ASR language: English, Igbo, Hausa, Yoruba"),
    model_preference: Optional[ModelPreference] = Form(None),
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
    - language: Optional language code (e.g., "en", "fr").
    - provider_preference: e.g., "openai".
    - audio_file: The audio file to transcribe (WAV/MP3).
    

    Demo Form Schema:

            {
                "fields": [
                { "id": "patientName", "type": "text", "required": true },
                { "id": "patientAge", "type": "number", "required": true },
                { "id": "patientGender", "type": "select", "required": true },
                { "id": "symptomsDate", "type": "date", "required": true },
                { "id": "reportedSymptoms", "type": "multiselect", "required": false },
                { "id": "testResult", "type": "select", "required": true },
                { "id": "treatmentProvided", "type": "select", "required": false },
                { "id": "healthWorkerId", "type": "text", "required": true },
                { "id": "location", "type": "text", "required": true },
                { "id": "followUpRequired", "type": "boolean", "required": false },
                { "id": "notes", "type": "textarea", "required": false }
                ]
            }

    Process:
    1. Parse and validate form_schema.
    2. Transcribe audio to text using Whisper ASR.
    3. Run extraction on the transcribed text with the configured model.
    4. Apply heuristics for the medical fields listed above.

    Returns:
    - extracted: Filled fields
    - missing_required: Any required but missing fields
    - metrics: ASR/LLM timings and model info

    Errors:
    - 400: Invalid form_schema or audio file
    - 502: Transcription/provider error (with details)
    """
    # Enforce demo_form1 shape
    try:
        schema = ensure_demo_schema(form_schema)
    except BadFormSchema as e:
        raise HTTPException(status_code=422, detail=str(e))

    suffix = f"_{audio_file.filename}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio_file.read()
        tmp.write(content)
        tmp_path = tmp.name

    # Transcription: Spitch for selected languages; Whisper for English
    try:
        if language != LanguagePreference.English:
            # Map friendly label to Spitch language code
            lang_map = {"Igbo": "ig", "Hausa": "ha", "Yoruba": "yo"}
            src_code = lang_map.get(language.value)
            if not src_code:
                raise HTTPException(status_code=400, detail=f"Unsupported language: {language.value}")
            transcript, asr_ms = SpitchService.transcribe(tmp_path, src_code)
            asr_provider = "spitch"
            lang_used = language.value
        else:
            transcript, asr_ms = whisper_service.transcribe(tmp_path, language=None)
            asr_provider = "whisper"
            lang_used = "English"
    except Exception as e:
        # No fallback for Igbo/Hausa/Yoruba
        if language != LanguagePreference.English:
            raise HTTPException(status_code=502, detail=f"Spitch ASR error: {e}")
        # For auto, just surface the original error
        raise HTTPException(status_code=502, detail=f"ASR error: {e}")

    _pick = router.pick(model_preference, need_vision=False)
    if isinstance(_pick, tuple):
        provider_name, model_override = _pick
    else:
        provider_name = _pick
        model_override = None

    # Translate to English using Spitch when a specific non-auto language is chosen
    if language != LanguagePreference.English:
        try:
            lang_map = {"Igbo": "ig", "Hausa": "ha", "Yoruba": "yo"}
            src_code = lang_map.get(language.value)
            translated_text, _tr_ms = SpitchService.translate(transcript, source=src_code, target="en")
            if translated_text:
                transcript = translated_text
        except Exception as e:
            # No fallback – Spitch must be used for translation for ig/ha/yo
            raise HTTPException(status_code=502, detail=f"Spitch translation error: {e}")

    # --- Costing for ASR and Translation ---
    asr_cost = 0.0
    translation_cost = 0.0
    try:
        if asr_provider == "spitch":
            # $0.00042 per second for transcription
            asr_cost = ((asr_ms or 0) / 1000.0) * getattr(settings, "SPITCH_PRICE_TRANSCRIPTION_PER_SEC", 0.0)
            # $1 per 10,000 words for translation (count on English transcript)
            word_count = len((transcript or "").split())
            translation_cost = (word_count / 10000.0) * getattr(settings, "SPITCH_PRICE_TRANSLATION_PER_10K_WORDS", 0.0)
        elif asr_provider == "whisper" and getattr(settings, "WHISPER_MODE", "api") == "api":
            # Whisper API: $0.17 per hour
            hours = (asr_ms or 0) / 1000.0 / 3600.0
            asr_cost = hours * getattr(settings, "WHISPER_API_PRICE_PER_HOUR", 0.0)
    except Exception:
        # Never fail the request due to cost math; leave additional costs as zero on error
        asr_cost = asr_cost or 0.0
        translation_cost = translation_cost or 0.0

    try:
        data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
            provider_name=provider_name,
            form_schema=schema,
            text_blob=transcript,
            images=None,
            ocr_blocks=None,
            locale=None,
            model_override=model_override,
        )
    except TypeError as e:
        if "model_override" in str(e):
            data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
                provider_name=provider_name,
                form_schema=schema,
                text_blob=transcript,
                images=None,
                ocr_blocks=None,
                locale=None,
            )
        else:
            raise HTTPException(status_code=502, detail=f"Extraction error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Extraction error: {e}")

    # Heuristic fallback/merge
    heur = heuristic_extract_from_text(transcript or "", schema)
    if not isinstance(data, dict):
        data = {}
    for k, v in heur.items():
        if k not in data or data[k] in (None, "", [], {}):
            data[k] = v

    validator = SchemaValidator(schema)
    missing = validator.validate_and_report(data)

    total_ms = (asr_ms or 0) + (llm_ms or 0)

    total_cost = (cost or 0.0) + asr_cost + translation_cost
    metrics = ExtractionMetrics(
        asr_seconds=round((asr_ms or 0) / 1000, 2),
        vision_seconds=round(0 / 1000, 2),
        llm_seconds=round((llm_ms or 0) / 1000, 2),
        total_seconds=round(total_ms / 1000, 2),
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=round(total_cost, 6),
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
        meta={
            "asr_provider": asr_provider,
            "language": lang_used,
            "cost_breakdown": {
                "asr_cost_usd": round(asr_cost, 6),
                "translation_cost_usd": round(translation_cost, 6),
                "llm_cost_usd": round(cost or 0.0, 6),
            },
        },
    )


@app.post("/process/image", response_model=ExtractionResponse, response_model_exclude_none=True, tags=["AI"])
async def process_image(
    form_id: str = Form(...),
    form_schema: str = Form(...),
    use_vision: bool = Form(True),
    model_preference: Optional[ModelPreference] = Form(None),
    images: List[UploadFile] = File(...),
):
    """OCR + Extraction (schema-agnostic heuristics + LLM merge).

    Flow:
      1. OCR each uploaded image (vision provider).
      2. Build an instruction header + OCR text and call LLM.
      3. Run generic key:value heuristics (any schema) + medical heuristics (legacy).
      4. Merge results (LLM > generic > medical > defaults) and validate.
    """
    # Normalize/validate schema
    try:
        schema = ensure_demo_schema(form_schema)
    except BadFormSchema as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Persist temp files for OCR
    tmp_paths: List[str] = []
    for img in images:
        suffix = f"_{img.filename}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await img.read()
            tmp.write(content)
            tmp_paths.append(tmp.name)

    ocr_texts: List[str] = []
    all_blocks: List[dict] = []
    vision_ms_total = 0
    for p in tmp_paths:
        ocr_text, blocks, vision_ms = vision_service.ocr(p, provider_client=default_openai_provider)
        ocr_texts.append(ocr_text)
        all_blocks.extend(blocks)
        vision_ms_total += vision_ms

    raw_ocr_text = "\n".join(ocr_texts)

    header = build_extraction_header(schema)
    combined_text = f"{header}\n\n---\nSOURCE TEXT:\n{raw_ocr_text}"

    _pick = router.pick(model_preference, need_vision=use_vision)
    if isinstance(_pick, tuple):
        provider_name, model_override = _pick
    else:
        provider_name = _pick
        model_override = None
    try:
        data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
            provider_name=provider_name,
            form_schema=schema,
            text_blob=combined_text,
            images=None,
            ocr_blocks=all_blocks,
            locale=None,
            model_override=model_override,
        )
    except TypeError as e:
        if "model_override" in str(e):
            data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
                provider_name=provider_name,
                form_schema=schema,
                text_blob=combined_text,
                images=None,
                ocr_blocks=all_blocks,
                locale=None,
            )
        else:
            raise HTTPException(status_code=502, detail=f"Extraction error: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Extraction error: {e}")

    # Normalise possible wrapper
    if isinstance(data, dict) and isinstance(data.get("extracted"), dict):
        llm_fields = data.get("extracted", {})
    elif isinstance(data, dict):
        llm_fields = data
    else:
        llm_fields = {}

    generic_fields = generic_heuristic_extract(raw_ocr_text, schema)
    medical_fields = heuristic_extract_from_text(raw_ocr_text, schema)

    merged: Dict[str, Any] = {}
    for fdef in schema.get("fields", []):
        fid = fdef.get("id")
        if fid in llm_fields and llm_fields[fid] not in (None, "", [], {}):
            merged[fid] = llm_fields[fid]
        elif fid in generic_fields and generic_fields[fid] not in (None, "", [], {}):
            merged[fid] = generic_fields[fid]
        elif fid in medical_fields and medical_fields[fid] not in (None, "", [], {}):
            merged[fid] = medical_fields[fid]
        else:
            merged[fid] = generic_fields.get(fid)

    validator = SchemaValidator(schema)
    missing = validator.validate_and_report(merged)

    total_ms = (vision_ms_total or 0) + (llm_ms or 0)
    metrics = ExtractionMetrics(
        asr_seconds=0.0,
        vision_seconds=round((vision_ms_total or 0) / 1000, 2),
        llm_seconds=round((llm_ms or 0) / 1000, 2),
        total_seconds=round(total_ms / 1000, 2),
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=round(cost, 6),
        provider=provider_name,
        model=model,
    )

    return ExtractionResponse(
        form_id=form_id,
        form_version=None,
        extracted=merged,
        confidence={k: 0.8 for k in merged.keys()},
        spans={},
        missing_required=missing,
        metrics=metrics,
    )
    """Debug endpoint to see raw OCR output"""
    temp_paths = []
    for img in images:
        suffix = f"_{img.filename}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await img.read()
            tmp.write(content)
            temp_paths.append(tmp.name)

    ocr_results = []
    for p in temp_paths:
        ocr_text, blocks, vision_ms = vision_service.ocr(p, provider_client=default_openai_provider)
        ocr_results.append({
            "path": p,
            "ocr_text": ocr_text,
            "blocks_count": len(blocks),
            "vision_ms": vision_ms
        })

    return {"ocr_results": ocr_results}


# --- Heuristic helpers for the medical schema ---

def _norm_line(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    return s.strip("•·-—–*☒☐✓✔✗[]() \t\r\n")

def _parse_bool(v: Optional[str]) -> Optional[bool]:
    if not v:
        return None
    x = v.strip().lower()
    if x in {"yes", "y", "true", "t", "1"}:
        return True
    if x in {"no", "n", "false", "f", "0"}:
        return False
    return None

def _parse_date_any(s: str) -> Optional[str]:
    s = s or ""
    s = s.strip()
    # 2025-09-21 / 2025/09/21
    m = re.search(r"\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b", s)
    if m:
        y, mo, d = map(int, m.groups())
        try:
            return datetime(y, mo, d).strftime("%Y-%m-%d")
        except Exception:
            pass
    # 21/09/2025 or 09/21/2025
    m = re.search(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b", s)
    if m:
        a, b, y = map(int, m.groups())
        try:
            if a > 12:
                d, mo = a, b
            else:
                mo, d = a, b
            return datetime(y, mo, d).strftime("%Y-%m-%d")
        except Exception:
            pass
    # 21 Sep 2025 / September 21, 2025
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s*(\d{4})\b", s)
    if m:
        d, mon, y = int(m.group(1)), m.group(2), int(m.group(3))
        for fmt in ("%d %B %Y", "%d %b %Y"):
            try:
                return datetime.strptime(f"{d} {mon} {y}", fmt).strftime("%Y-%m-%d")
            except Exception:
                continue
    return None

_SYMPTOM_VOCAB = {
    "fever", "headache", "chills", "cough", "nausea", "vomiting", "diarrhea",
    "fatigue", "body pain", "muscle pain", "sore throat", "loss of appetite",
    "sweats", "weakness", "dizziness"
}

def _split_symptoms(s: str) -> List[str]:
    s = (s or "").lower()
    parts = re.split(r"[;,]", s)
    out: List[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if p in _SYMPTOM_VOCAB:
            out.append(p)
        else:
            for vocab in _SYMPTOM_VOCAB:
                if vocab in p and vocab not in out:
                    out.append(vocab)
    return out

def heuristic_extract_from_text(text: str, form_schema: dict) -> dict:
    # Initialize defaults based on schema
    fields = {}
    for f in form_schema.get("fields", []):
        fid = f.get("id")
        ftype = (f.get("type") or "").lower()
        if not isinstance(fid, str):
            continue
        if ftype == "number":
            fields[fid] = None
        elif ftype == "multiselect":
            fields[fid] = []
        elif ftype == "boolean":
            fields[fid] = None
        else:
            fields[fid] = ""

    # Pass 1: key:value style lines
    for raw in (text or "").splitlines():
        line = _norm_line(raw)
        if not line:
            continue
        key, value = (line.split(":", 1) + [""])[:2] if ":" in line else (line, "")
        key = key.strip().lower()
        value = value.strip()

        if "patient name" in key or key == "name":
            if "patientName" in fields and value:
                fields["patientName"] = value
        elif "age" in key:
            if "patientAge" in fields:
                m = re.search(r"\b(\d{1,3})\b", value or line)
                if m:
                    fields["patientAge"] = int(m.group(1))
        elif "gender" in key or "sex" in key:
            if "patientGender" in fields:
                v = (value or line).lower()
                if "female" in v or v.strip() in {"f"}:
                    fields["patientGender"] = "Female"
                elif "male" in v or v.strip() in {"m"}:
                    fields["patientGender"] = "Male"
        elif "symptoms date" in key or "date of symptoms" in key or key == "date" or "onset date" in key:
            if "symptomsDate" in fields:
                d = _parse_date_any(value or line)
                if d:
                    fields["symptomsDate"] = d
        elif "reported symptoms" in key or key == "symptoms":
            if "reportedSymptoms" in fields:
                vals = _split_symptoms(value or "")
                if vals:
                    fields["reportedSymptoms"] = vals
        elif "test result" in key or key == "result":
            if "testResult" in fields:
                v = (value or line).lower()
                if "positive" in v:
                    fields["testResult"] = "Positive"
                elif "negative" in v:
                    fields["testResult"] = "Negative"
                elif "inconclusive" in v:
                    fields["testResult"] = "Inconclusive"
                else:
                    fields["testResult"] = value
        elif "treatment provided" in key or key == "treatment" or "therapy" in key or "medication" in key:
            if "treatmentProvided" in fields:
                fields["treatmentProvided"] = value or fields["treatmentProvided"]
        elif "health worker id" in key or "hw id" in key or "staff id" in key or "worker id" in key:
            if "healthWorkerId" in fields:
                v = re.sub(r"[^A-Za-z0-9\-_]", "", value or "")
                fields["healthWorkerId"] = v
        elif "location" in key:
            if "location" in fields:
                fields["location"] = value or fields["location"]
        elif "follow up" in key or "follow-up" in key or "followup" in key:
            if "followUpRequired" in fields:
                b = _parse_bool(value or line)
                if b is not None:
                    fields["followUpRequired"] = b
        elif "notes" in key or "remarks" in key or "comments" in key or "observation" in key:
            if "notes" in fields:
                fields["notes"] = value or fields["notes"]

    # Pass 2: fallbacks from free text
    if "patientName" in fields and not fields["patientName"]:
        m = re.search(r"\b(Patient\s+Name|Name)\s*:\s*([A-Za-z][A-Za-z.'-]+\s+[A-Za-z][A-Za-z.'-]+)", text, re.IGNORECASE)
        if m:
            fields["patientName"] = m.group(2).strip()

    if "patientAge" in fields and fields["patientAge"] is None:
        m = re.search(r"\bAge\s*:\s*(\d{1,3})\b", text, re.IGNORECASE)
        if m:
            fields["patientAge"] = int(m.group(1))

    if "patientGender" in fields and not fields["patientGender"]:
        m = re.search(r"\b(Gender|Sex)\s*:\s*(Male|Female|M|F)\b", text, re.IGNORECASE)
        if m:
            v = m.group(2).lower()
            fields["patientGender"] = "Female" if v.startswith("f") else "Male"

    if "symptomsDate" in fields and not fields["symptomsDate"]:
        d = _parse_date_any(text)
        if d:
            fields["symptomsDate"] = d

    if "reportedSymptoms" in fields and not fields["reportedSymptoms"]:
        fields["reportedSymptoms"] = _split_symptoms(text)

    if "followUpRequired" in fields and fields["followUpRequired"] is None:
        b = _parse_bool(text)
        if b is not None:
            fields["followUpRequired"] = b

    return fields

# ---------------- Generic (schema-agnostic) heuristic extraction utilities -----------------

def _generate_field_aliases(field_id: str) -> List[str]:
    """Generate alias candidates for fuzzy key matching of arbitrary schema field IDs."""
    base = field_id.strip()
    aliases = set()
    simple = re.sub(r"[^A-Za-z0-9]", "", base).lower()
    if simple:
        aliases.add(simple)
    tokens = re.findall(r"[A-Z]?[a-z]+|[0-9]+", base)
    if not tokens:
        tokens = [base]
    tokens_lower = [t.lower() for t in tokens]
    spaced = " ".join(tokens_lower)
    aliases.add(spaced)
    aliases.add("".join(tokens_lower))
    if spaced.endswith(" id"):
        aliases.add(spaced[:-3])
    if spaced.endswith(" date"):
        aliases.add(spaced[:-5])
    if "date" in tokens_lower and "birth" in tokens_lower:
        aliases.add("dob")
        aliases.add("birth date")
    if tokens_lower[-1] == "name" and len(tokens_lower) > 1:
        aliases.add("name")
    if tokens_lower[-1] == "id" and len(tokens_lower) > 1:
        aliases.add("id")
    return list(aliases)

def _best_field_match(key_norm: str, field_alias_map: Dict[str, List[str]]) -> Optional[str]:
    best_id = None
    best_score = 0
    for fid, aliases in field_alias_map.items():
        for a in aliases:
            if not a:
                continue
            score = 0
            if key_norm == a:
                score = 100
            elif a in key_norm or key_norm in a:
                score = 80
            else:
                toks_a = set(a.split())
                toks_k = set(key_norm.split())
                if toks_a and toks_k:
                    overlap = len(toks_a & toks_k) / len(toks_a | toks_k)
                    score = int(overlap * 60)
            if score > best_score:
                best_score = score
                best_id = fid
    return best_id if best_score >= 40 else None

def generic_heuristic_extract(text: str, form_schema: dict) -> Dict[str, Any]:
    """Schema-agnostic extraction using fuzzy key:value line parsing."""
    fields_def = form_schema.get("fields", [])
    out: Dict[str, Any] = {}
    for f in fields_def:
        fid = f.get("id")
        ftype = (f.get("type") or "").lower()
        if ftype == "number":
            out[fid] = None
        elif ftype == "multiselect":
            out[fid] = []
        elif ftype == "boolean":
            out[fid] = None
        else:
            out[fid] = ""

    alias_map: Dict[str, List[str]] = {f.get("id"): _generate_field_aliases(f.get("id")) for f in fields_def if f.get("id")}
    options_map: Dict[str, List[str]] = {}
    for f in fields_def:
        fid = f.get("id")
        opts = f.get("options") or []
        if isinstance(opts, list):
            options_map[fid] = [str(o) for o in opts]

    line_re = re.compile(r"^\s*([A-Za-z0-9 ._/()\-]{1,64})\s*[:=\-]\s*(.+)$")
    for raw in (text or "").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        m = line_re.match(raw)
        if not m:
            continue
        key_raw, val_raw = m.group(1).strip(), m.group(2).strip()
        key_norm = re.sub(r"[^a-z0-9 ]", "", key_raw.lower())
        fid = _best_field_match(key_norm, alias_map)
        if not fid:
            continue
        fdef = next((fd for fd in fields_def if fd.get("id") == fid), {})
        ftype = (fdef.get("type") or "").lower()
        if ftype == "number":
            mnum = re.search(r"\b\d+(?:\.\d+)?\b", val_raw)
            if mnum:
                try:
                    out[fid] = float(mnum.group(0)) if "." in mnum.group(0) else int(mnum.group(0))
                except Exception:
                    pass
        elif ftype == "boolean":
            b = _parse_bool(val_raw)
            if b is not None:
                out[fid] = b
        elif ftype == "date":
            d = _parse_date_any(val_raw)
            if d:
                out[fid] = d
        elif ftype == "multiselect":
            parts = [p.strip() for p in re.split(r"[;,]", val_raw) if p.strip()]
            opts = options_map.get(fid)
            if opts:
                norm_opts = {o.lower(): o for o in opts}
                matched = []
                for p in parts:
                    pl = p.lower()
                    if pl in norm_opts:
                        matched.append(norm_opts[pl])
                    else:
                        for ol, orig in norm_opts.items():
                            if pl in ol or ol in pl:
                                matched.append(orig)
                                break
                if matched:
                    out[fid] = matched
            else:
                if parts:
                    out[fid] = parts
        elif ftype == "select":
            opts = options_map.get(fid)
            if opts:
                vl = val_raw.lower()
                chosen = None
                for o in opts:
                    if o.lower() == vl:
                        chosen = o; break
                if not chosen:
                    for o in opts:
                        if o.lower() in vl or vl in o.lower():
                            chosen = o; break
                out[fid] = chosen if chosen else val_raw
            else:
                out[fid] = val_raw
        else:
            out[fid] = val_raw
    return out

# keep only one clean version of this helper
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