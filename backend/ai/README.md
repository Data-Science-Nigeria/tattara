## AI Backend — README

This repository contains a small FastAPI-based AI extraction backend that accepts text, audio, and image inputs and returns structured data according to a supplied form schema. It's intended as a lightweight extraction microservice you can adapt and wire to your own providers (OpenAI, Groq, local Whisper, etc.).

## Quick summary

- Start the service: run the FastAPI app (`app.main`).
- Endpoints: `/process/text`, `/process/audio`, `/process/image`, and `/health`.
- Provide a `form_schema` (same shape as your Form Registry) to tell the service what fields to extract and validate.

## Quickstart

1. Copy or create your environment file and set keys:

   - Copy an example env file to `.env` (if present) or create one next to the project root.
2. Install dependencies (project uses Python and pip):

   ```powershell
   pip install -r requirements.txt
   ```
3. Run the app locally:

   ```powershell
   uvicorn app.main:app --reload
   ```
4. Verify health:

   - GET /health — returns JSON with `status: ok` and `env`.

## Environment variables

The app uses `pydantic-settings` and `app/config.py` to load runtime configuration. Key variables you may want to set in `.env`:

- APP_NAME (string) — default: `ai-backend`
- APP_ENV (string) — default: `dev`
- LOG_LEVEL (string) — e.g. `INFO` or `DEBUG`
- WHISPER_MODE (string) — `api` or `local`. When `api` the OpenAI Whisper API is used; `local` uses a local whisper implementation when available.
- OPENAI_API_KEY — API key used for OpenAI (Whisper, vision calls, and LLM calls).
- DEFAULT_PROVIDER — `openai` or `groq`. Selects default LLM provider for extraction routing.
- OPENAI_MODEL — model id used when `DEFAULT_PROVIDER` is `openai` (default: `gpt-5-mini` in config).
- GROQ_API_KEY / GROQ_MODEL — credentials and model id for Groq provider if you use it.
- OCR_ENABLED (bool) — enables OCR pipeline for images (default: True).
- PRICE_OPENAI_PER_1K_INPUT, PRICE_OPENAI_PER_1K_OUTPUT — simple per-1k token pricing used by the metrics calculation (replace with your own pricing in production).

The full set of default fields is declared in `app/config.py` — review it when adding keys.

## API Endpoints

1) **POST /process/text**

- Content-Type: application/json
- Request body: TextRequest (see `app/models.py` and `app/schemas.py`) — minimal shape:

  ```json
  {
    "form_id": "vehicle_reg_v2",
    "form_schema": { /* JSON schema describing fields */ },
    "text": "free-form text to extract from",
    "provider_preference": "openai" /* optional */
  }
  ```

2) **POST /process/audio**

- multipart/form-data
- Fields:
  - `form_id` (string)
  - `form_schema` (string) — JSON string (the same object you would send in `form_schema` for text)
  - `language` (optional)
  - `provider_preference` (optional)
  - `audio_file` (file) — audio blob to transcribe

3) **POST /process/image**

- multipart/form-data
- Fields:
  - `form_id` (string)
  - `form_schema` (string) — JSON string
  - `use_vision` (bool, default true) — whether to run OCR/vision pipeline
  - `provider_preference` (optional)
  - `images` (file[]) — one or more image files

Responses from the above endpoints conform to `ExtractionResponse` (see `app/models.py`) and include:

- `form_id`, `extracted` (the extracted fields map), `confidence`, `missing_required` (array of missing required fields), and `metrics` (ASR/vision/LLM timing, tokens, cost estimate, provider used, model id).

## Form schema (example)

The service expects a form schema in the same simplified shape used by the repo. Example:

```json
{
  "form_id": "demo_form1",
  "form_schema": {
    "fields": [
      { "id": "first_name", "type": "string", "required": true },
      { "id": "last_name", "type": "string", "required": true },
      { "id": "email", "type": "string", "pattern": "^\\S+@\\S+\\.\\S+$", "required": false },
      { "id": "age", "type": "integer", "required": false },
      { "id": "comments", "type": "string", "required": false }
    ]
  },
  "text": "John Doe is 34 years old. He can be reached at john.doe@example.com. He said: I had a fantastic experience. No further comments.",
  "provider_preference": null
}
```

Validation is performed by `app/services/validator.py` using `jsonschema`. Fields flagged as `required` but not found in the extracted result will appear in the `missing_required` list in the response.

## Provider behaviour

- OpenAI provider (`app/services/providers/openai_provider.py`) is the default. If `OPENAI_API_KEY` is missing the provider will fallback to a dev echo behavior.
- Groq provider is also supported as a second option — configure `DEFAULT_PROVIDER` and `GROQ_API_KEY` to use it.
- Vision/OCR: the repo includes a basic OCR flow that can either send images through the provider or run lightweight OCR (controlled by `OCR_ENABLED`).
- Whisper: set `WHISPER_MODE=api` to call the OpenAI Whisper API for audio transcription, or `local` to use a local faster-whisper implementation where available.

Notes on image handling: the `OpenAIProvider.process_image` method contains a basic adapter that base64-encodes image bytes and asks the model to extract text — this is a fallback and not efficient for large images. For production, replace with provider-native file uploads or a multimodal API call.

## Troubleshooting

- 400 Invalid form_schema JSON: ensure `form_schema` posted to `/process/audio` or `/process/image` is a valid JSON string.
- 502 Provider errors: extraction errors from downstream providers are surfaced as HTTP 502 with the provider message.
- API client missing: if provider SDKs are not installed or keys are missing, the provider object will fallback to a safe dev mode (check logs).

## Files of interest

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
- 
- `app/config.py` — environment config and defaults
- `app/main.py` — FastAPI routes and wiring
- `app/services/*` — core services (whisper, vision, extraction router, validator)
- `app/services/providers/*` — provider adapters (OpenAI, Groq)

