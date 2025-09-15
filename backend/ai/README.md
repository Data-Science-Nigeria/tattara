==============

Quickstart

---

1) cp .env.example .env and fill keys
2) pip install -r requirements.txt
3) uvicorn app.main:app --reload
4) Test endpoints:

   - POST /process/text    (JSON)
   - POST /process/audio   (multipart: audio_file + form_schema JSON string)
   - POST /process/image   (multipart: images[] + form_schema JSON string)

Example form_schema payload (same shape as your Form Registry):

{

  "form_id": "vehicle_reg_v2",

  "version": 2,

  "fields": [

    {"id":"owner_full_name","type":"string","required":true},

    {"id":"owner_phone","type":"string","pattern":"^\\+?[0-9\\- ]{7,15}$"},

    {"id":"vin","type":"string","minLength":11,"maxLength":17}

  ]

}

Notes

---

• Whisper: set WHISPER_MODE=api to use OpenAI Whisper; set to local to use faster-whisper.

• Vision: by default uses OCR text; wire signed image URLs to enable true vision inputs with OpenAI.

• Token & cost: lightweight; replace with your pricing table and provider usage fields in prod.

• Validation: jsonschema enforces types/enums/required; missing fields returned in response.

# Tattara AI (backend/ai)

FastAPI service for extracting structured data from text, images, and audio. It routes requests to LLM providers and applies a lightweight heuristic to improve form-filling reliability from OCR output.

## Features

- FastAPI endpoints with OpenAPI docs (/docs)
- Provider routing (OpenAI, optional Groq)
- Vision/OCR pipeline with image inputs (OpenAI gpt-4o recommended)
- Heuristic extraction for common fields (first_name, last_name, email, age, comments)
- Local OCR test script (ocr_test.py)

## Requirements

- Python 3.10+ (3.11 recommended)
- Virtual environment (Windows .venv)
- Packages: fastapi, uvicorn, openai, python-dotenv (and others in requirements)

## Setup

1) Clone and create a venv

- PowerShell:
  - cd C:\Users\johne\Desktop\DSN\tattara\backend\ai
  - python -m venv .venv
  - .\.venv\Scripts\Activate.ps1

2) Install deps

- pip install -r requirements.txt
- If no requirements file, install essentials:
  - pip install fastapi uvicorn openai python-dotenv

3) Environment variables (do not commit .env)

- backend/ai/.env:
  - OPENAI_API_KEY=your-key
  - GROQ_API_KEY=optional-key

4) Model configuration

- Set the model in app/config.py (not in .env):
  - OPENAI_MODEL = "gpt-4o"  (recommended for OCR)
  - Use "gpt-5-mini" for text-only paths if desired (not vision-capable)

## Run the API

- cd C:\Users\johne\Desktop\DSN\tattara\backend\ai
- $env:PYTHONPATH="."
- uvicorn app.main:app --host localhost --port 8000 --reload
- Open docs: <http://localhost:8000/docs>

## Endpoints

### POST /process/text

- Body (JSON):
  {
    "form_id": "demo_form1",
    "form_schema": {
      "fields": [
        { "id": "first_name", "type": "string" },
        { "id": "last_name", "type": "string" },
        { "id": "email", "type": "string" },
        { "id": "age", "type": "integer" },
        { "id": "comments", "type": "string" }
      ]
    },
    "text": "Paste text here",
    "provider_preference": "openai",
    "locale": null
  }
- Note: escape regex in JSON (double backslashes).

### POST /process/image

- Form-data fields:
  - form_id: string
  - form_schema: JSON string of the fields object (see above)
  - use_vision: true
  - provider_preference: openai
  - images: one or more PNG/JPEG files
- The service:
  - Sends images to the provider as image inputs (no base64 truncation)
  - Uses vision model (e.g., gpt-4o)
  - Applies heuristic extraction to populate first_name, last_name, email, age, comments

## Local OCR test (script)

- File: backend/ai/ocr_test.py
- Usage:
  - Ensure backend/ai/.env has OPENAI_API_KEY
  - Ensure app/config.py sets OPENAI_MODEL="gpt-4o"
  - PowerShell:
    - cd backend/ai
    - $env:PYTHONPATH="."
    - python ocr_test.py
- Prints:
  - Raw OCR text
  - Extracted fields (heuristic)

## Heuristic extraction

- Normalizes OCR lines (removes bullets/checkboxes)
- Parses key: value lines for:
  - First name (first name, given name, firstname)
  - Last name (surname, family name, last name)
  - Email (validated via regex)
  - Age (digits)
  - Comments/Notes
- Fallback for "Name: First Last" format

## Common issues and fixes

- 500 NameError: req is not defined
  - Fixed by removing stale req usage and parsing form_schema directly.
- Invalid JSON in Swagger “Failed to fetch”
  - Ensure valid JSON; escape regex; no trailing quotes.
- Vision errors or empty OCR text
  - Use a vision-capable model (OPENAI_MODEL="gpt-4o"); ensure OPENAI_API_KEY is set.
- Truncated base64
  - Not used; images are sent as image inputs (data URL), no truncation.
- CORS during cross-origin testing
  - Add permissive CORS in development if calling from another origin.

## Git tips

- Ignore local artifacts:
  - .venv/, .vscode/, .env
- If already tracked:
  - git rm -r --cached .venv .vscode .env backend/ai/.env
  - commit .gitignore updates
- Branch/push flow:
  - git checkout john-ai
  - git add -A
  - git commit -m "feat(vision): improve /process/image with heuristic extraction"
  - git pull --rebase origin john-ai
  - git push -u origin john-ai

## Security

- Never commit .env or keys; rotate any exposed keys immediately.

## License

- TBD.
