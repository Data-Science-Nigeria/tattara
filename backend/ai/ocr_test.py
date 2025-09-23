import os
from pathlib import Path
import json
import re

# Load .env only for API keys
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).with_name(".env"))
except Exception:
    pass

from app.config import get_openai_model
from app.services.providers.openai_provider import OpenAIProvider

IMAGE_PATH = "files\image_test_3.jpg"
API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
MODEL = get_openai_model()  # model comes from app/config.py

if not API_KEY:
    raise SystemExit("OPENAI_API_KEY not set. Put it in backend/ai/.env.")

img_path = Path(IMAGE_PATH)
if not img_path.exists():
    raise SystemExit(f"Image not found: {IMAGE_PATH}")

img_bytes = img_path.read_bytes()
provider = OpenAIProvider(api_key=API_KEY, model=MODEL)
res = provider.process_image(img_bytes, img_path.name)

if isinstance(res, dict) and res.get("_error"):
    print("Provider error:", res["_error"])
    raise SystemExit(1)

raw_text = res["text"] if isinstance(res, dict) else str(res)
print("\n=== OCR Raw Text ===\n")
print(raw_text)

# --- Map OCR text to your form schema fields ---

import unicodedata
import re
import json
from datetime import datetime

FORM_SCHEMA = {
    "fields": [
        {"id": "patientName", "type": "text", "required": True},
        {"id": "patientAge", "type": "number", "required": True},
        {"id": "patientGender", "type": "select", "required": True},
        {"id": "symptomsDate", "type": "date", "required": True},
        {"id": "reportedSymptoms", "type": "multiselect", "required": False},
        {"id": "testResult", "type": "select", "required": True},
        {"id": "treatmentProvided", "type": "select", "required": False},
        {"id": "healthWorkerId", "type": "text", "required": True},
        {"id": "location", "type": "text", "required": True},
        {"id": "followUpRequired", "type": "boolean", "required": False},
        {"id": "notes", "type": "textarea", "required": False}
    ]
}

def normalize_line(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    return s.strip("•·-—–*☒☐✓✔✗[]() \t\r\n")

def parse_bool(v: str | None) -> bool | None:
    if not v:
        return None
    x = v.strip().lower()
    if x in {"yes", "y", "true", "t", "1"}:
        return True
    if x in {"no", "n", "false", "f", "0"}:
        return False
    return None

def parse_date_any(s: str) -> str | None:
    # Try common formats and return ISO YYYY-MM-DD
    s = s.strip()
    patterns = [
        r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})",          # 2025-09-23 or 2025/09/23
        r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})",          # 09/23/2025 or 23-09-2025
    ]
    for pat in patterns:
        m = re.search(pat, s)
        if m:
            g = [int(x) for x in m.groups()]
            try:
                if len(g) == 3 and g[0] > 31:  # yyyy, mm, dd
                    y, mo, d = g
                elif len(g) == 3 and g[2] > 31:  # dd/mm/yyyy or mm/dd/yyyy
                    a, b, y = g
                    # Heuristic: if a > 12 treat as dd/mm
                    if a > 12:
                        d, mo = a, b
                    else:
                        mo, d = a, b
                else:
                    continue
                return datetime(y, mo, d).strftime("%Y-%m-%d")
            except Exception:
                continue
    # Month name formats: 23 Sep 2025, September 23, 2025
    m = re.search(r"(\d{1,2})\s+([A-Za-z]{3,})\s*,?\s*(\d{4})", s)
    if m:
        d, mon, y = int(m.group(1)), m.group(2), int(m.group(3))
        try:
            return datetime.strptime(f"{d} {mon} {y}", "%d %B %Y").strftime("%Y-%m-%d")
        except Exception:
            try:
                return datetime.strptime(f"{d} {mon} {y}", "%d %b %Y").strftime("%Y-%m-%d")
            except Exception:
                pass
    return None

SYMPTOM_VOCAB = {
    "fever", "headache", "chills", "cough", "nausea", "vomiting", "diarrhea",
    "fatigue", "body pain", "muscle pain", "sore throat", "loss of appetite",
    "sweats", "weakness", "dizziness"
}

def split_symptoms(s: str) -> list[str]:
    s = s.lower()
    # Split by comma or semicolon
    parts = re.split(r"[;,]", s)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # keep only known symptom words to avoid noise
        if p in SYMPTOM_VOCAB:
            out.append(p)
        else:
            # try to match vocab tokens embedded in text
            for vocab in SYMPTOM_VOCAB:
                if vocab in p and vocab not in out:
                    out.append(vocab)
    return out

# Defaults
fields = {
    "patientName": "",
    "patientAge": None,
    "patientGender": "",
    "symptomsDate": "",
    "reportedSymptoms": [],
    "testResult": "",
    "treatmentProvided": "",
    "healthWorkerId": "",
    "location": "",
    "followUpRequired": None,
    "notes": ""
}

# Pass 1: line-based key:value extraction
for line in raw_text.splitlines():
    line = normalize_line(line)
    if not line:
        continue
    # split key: value
    if ":" in line:
        key, value = [p.strip() for p in line.split(":", 1)]
    else:
        key, value = line, ""

    k = key.lower()

    if any(x in k for x in ["patient name", "name"]):
        if value:
            fields["patientName"] = value
    elif any(x in k for x in ["age"]):
        m = re.search(r"\b(\d{1,3})\b", value or k)
        if m:
            fields["patientAge"] = int(m.group(1))
    elif any(x in k for x in ["gender", "sex"]):
        v = (value or k).lower()
        if "female" in v or v.strip() in {"f"}:
            fields["patientGender"] = "Female"
        elif "male" in v or v.strip() in {"m"}:
            fields["patientGender"] = "Male"
    elif any(x in k for x in ["symptoms date", "date of symptoms", "onset date", "date"]):
        d = parse_date_any(value or k)
        if d:
            fields["symptomsDate"] = d
    elif any(x in k for x in ["symptoms", "reported symptoms"]):
        vals = split_symptoms(value or "")
        if vals:
            fields["reportedSymptoms"] = vals
    elif any(x in k for x in ["test result", "result"]):
        v = (value or k).lower()
        if "positive" in v:
            fields["testResult"] = "Positive"
        elif "negative" in v:
            fields["testResult"] = "Negative"
        elif "inconclusive" in v:
            fields["testResult"] = "Inconclusive"
        else:
            fields["testResult"] = value
    elif any(x in k for x in ["treatment provided", "treatment", "therapy", "medication"]):
        fields["treatmentProvided"] = value or fields["treatmentProvided"]
    elif any(x in k for x in ["health worker id", "hw id", "staff id", "worker id"]):
        # Keep alphanumeric & dashes/underscores
        v = re.sub(r"[^A-Za-z0-9\-_]", "", value or "")
        fields["healthWorkerId"] = v
    elif "location" in k:
        fields["location"] = value or fields["location"]
    elif any(x in k for x in ["follow up", "follow-up", "followup"]):
        b = parse_bool(value or k)
        if b is not None:
            fields["followUpRequired"] = b
    elif any(x in k for x in ["notes", "remarks", "comments", "observation"]):
        fields["notes"] = value or fields["notes"]

# Pass 2: fallbacks from free text if still missing
if not fields["patientName"]:
    m = re.search(r"\bName\s*:\s*([A-Za-z][A-ZaZ.'-]+\s+[A-Za-z][A-ZaZ.'-]+)", raw_text, re.IGNORECASE)
    if m:
        fields["patientName"] = m.group(1).strip()

if fields["patientAge"] is None:
    m = re.search(r"\bAge\s*:\s*(\d{1,3})\b", raw_text, re.IGNORECASE)
    if m:
        fields["patientAge"] = int(m.group(1))

if not fields["patientGender"]:
    m = re.search(r"\b(Gender|Sex)\s*:\s*(Male|Female|M|F)\b", raw_text, re.IGNORECASE)
    if m:
        v = m.group(2).lower()
        fields["patientGender"] = "Female" if v.startswith("f") else "Male"

if not fields["symptomsDate"]:
    d = parse_date_any(raw_text)
    if d:
        fields["symptomsDate"] = d

if not fields["reportedSymptoms"]:
    fields["reportedSymptoms"] = split_symptoms(raw_text)

if fields["followUpRequired"] is None:
    b = parse_bool(raw_text)
    if b is not None:
        fields["followUpRequired"] = b

print("\n=== Extracted Fields (form schema) ===\n")
print(json.dumps(fields, indent=2))