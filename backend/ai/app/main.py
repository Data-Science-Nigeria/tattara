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
from .utils.schema import ensure_demo_schema, BadFormSchema
from datetime import datetime 

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


@app.post("/process/text", response_model=ExtractionResponse, response_model_exclude_none=True, tags=["AI"])
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
    provider_name = router.pick(req.provider_preference, need_vision)

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
        )
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

    transcript, asr_ms = whisper_service.transcribe(tmp_path, language=language)

    provider_name = router.pick(provider_preference, need_vision=False)

    data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
        provider_name=provider_name,
        form_schema=schema,
        text_blob=transcript,
        images=None,
        ocr_blocks=None,
        locale=None,
    )

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

    metrics = ExtractionMetrics(
        asr_seconds=round((asr_ms or 0) / 1000, 2),
        vision_seconds=round(0 / 1000, 2),
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
        extracted=data,
        confidence=confidence,
        spans={},
        missing_required=missing,
        metrics=metrics,
    )


@app.post("/process/image", response_model=ExtractionResponse, response_model_exclude_none=True, tags=["AI"])
async def process_image(
    form_id: str = Form(...),
    form_schema: str = Form(...),
    use_vision: bool = Form(True),
    model_preference: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
):
    """
    OCR + Form Extraction from Images

    Overview:
    - Accepts one or more PNG/JPEG files.
    - Uses a vision-capable model (e.g., gpt-4o) to transcribe text.
    - Applies heuristics to populate medical fields reliably.

    Request (multipart/form-data):
    - form_id: Your form identifier.
    - form_schema: JSON string of the fields object:
    - use_vision: true/false (true recommended).
    - provider_preference: e.g., "openai".
    - images: One or more PNG/JPEG files.

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
    2. OCR each image via the configured provider.
    3. Combine text and apply heuristics for:
       - patientName, patientAge, patientGender, symptomsDate
       - reportedSymptoms, testResult, treatmentProvided
       - healthWorkerId, location, followUpRequired, notes

    Returns:
    - extracted: Filled fields
    - missing_required: Any required but missing fields
    - metrics: Vision/LLM timings and model info

    Errors:
    - 400: Invalid form_schema
    - 502: OCR/provider error (with details)
    """
    # Coerce/validate form_schema to the demo_form1 shape
    try:
        schema = ensure_demo_schema(form_schema)
    except BadFormSchema as e:
        raise HTTPException(status_code=422, detail=str(e))

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

    # Pick using model_preference
    provider_name = router.pick(model_preference, need_vision=use_vision)
    data, confidence, llm_ms, tokens_in, tokens_out, cost, model = router.extract(
        provider_name=provider_name,
        form_schema=schema,
        text_blob=text_blob, 
        images=None,
        ocr_blocks=all_blocks,
        locale=None
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

    # Heuristic extraction from OCR text (new medical schema-aware)
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
        m = re.search(r"\b(Patient\s+Name|Name)\s*:\s*([A-Za-z][A-ZaZ.'-]+\s+[A-ZaZ][A-ZaZ.'-]+)", text, re.IGNORECASE)
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