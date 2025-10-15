from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
	APP_NAME: str = "ai-backend"
	APP_ENV: str = "dev"
	LOG_LEVEL: str = "INFO"

	# Whisper
	WHISPER_MODE: str = Field("api", description="api|local")
	OPENAI_API_KEY: str | None = None  # used for Whisper API and OpenAI LLM

	# LLMs
	DEFAULT_PROVIDER: str = Field("openai", description="openai|groq")
	GROQ_API_KEY: str | None = None
	OPENAI_MODEL: str = "gpt-4o"
	# Map to the real Groq model id you want to use (maverick variant)
	GROQ_MODEL: str = "meta-llama/llama-4-maverick-17b-128e-instruct"

	# Vision/OCR
	OCR_ENABLED: bool = True

	# Tokens & cost (simple example; replace with live pricing table)
	# Default provider-level fallbacks (kept for compatibility)
	PRICE_OPENAI_PER_1K_INPUT: float = 0.00025
	PRICE_OPENAI_PER_1K_OUTPUT: float = 0.001
	PRICE_GROQ_PER_1K_INPUT: float = 0.00011
	PRICE_GROQ_PER_1K_OUTPUT: float = 0.00034

	# Per-model pricing (per 1K tokens): input and output
	# Keys are normalized model identifiers used by the router/providers.
	MODEL_PRICING: dict = {
		# OpenAI models
		"gpt-4o": {"input": 0.0025, "output": 0.01},
		"gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
		"gpt-5": {"input": 0.00125, "output": 0.001},
		# Groq-hosted models
		"meta-llama/llama-4-maverick-17b-128e-instruct": {"input": 0.0002, "output": 0.0006},
		"meta-llama/llama-4-scout-17b-16e-instruct": {"input": 0.00011, "output": 0.00034},
		"qwen/qwen3-32b": {"input": 0.00029, "output": 0.00059},
	}

	class Config:
		env_file = ".env" # noqa


settings = Settings()


# Function to call model for OCR test.
def get_openai_model() -> str:
	# Single source of truth for model selection
	return settings.OPENAI_MODEL
