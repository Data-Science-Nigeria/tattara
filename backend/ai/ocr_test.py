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

IMAGE_PATH = r"C:\Users\johne\Desktop\DSN\picture trial.jpg"
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

# --- Improved heuristic mapping to form fields ---
import unicodedata
import re
import json

def normalize_line(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    # Strip common bullet/checkbox characters and leading symbols
    s = s.lstrip("•·-—–*☒☐✓✔✗[]() \t")
    return s.strip()

fields = {"first_name": "", "last_name": "", "email": "", "age": None, "comments": ""}

# First pass: line-based key:value extraction
for line in raw_text.splitlines():
    line = normalize_line(line)
    if not line or ":" not in line:
        continue
    key, value = [p.strip() for p in line.split(":", 1)]
    if not value:
        continue
    k = key.lower()
    if "first name" in k or "firstname" in k or "given name" in k:
        fields["first_name"] = value.split()[0]
    elif "surname" in k or "last name" in k or "lastname" in k or "family name" in k:
        fields["last_name"] = value.split()[-1]
    elif k.startswith("email"):
        m = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", value)
        if m:
            fields["email"] = m.group(0)
    elif k.startswith("age"):
        m = re.search(r"\d{1,3}", value)
        if m:
            fields["age"] = int(m.group(0))
    elif k.startswith("comments") or k.startswith("note"):
        fields["comments"] = value

# Fallbacks for alternate formats
if not fields["first_name"] or not fields["last_name"]:
    m = re.search(r"\bName\s*:\s*([A-Za-z]+)\s+([A-ZaZ]+)", raw_text, re.IGNORECASE)
    if m:
        fields["first_name"], fields["last_name"] = m.group(1), m.group(2)

if fields["age"] is None:
    m = re.search(r"\bAge\s*:\s*(\d{1,3})", raw_text, re.IGNORECASE)
    if m:
        fields["age"] = int(m.group(1))

print("\n=== Extracted Fields (improved heuristic) ===\n")
print(json.dumps(fields, indent=2))