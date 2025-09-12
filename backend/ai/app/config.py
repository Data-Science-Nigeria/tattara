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
	OPENAI_MODEL: str = "gpt-4o-mini"  # change here when you want a different model (e.g., "gpt-4o")
	GROQ_MODEL: str = "llama-4"

	# Vision/OCR
	OCR_ENABLED: bool = True

	# Tokens & cost (simple example; replace with live pricing table)
	PRICE_OPENAI_PER_1K_INPUT: float = 0.00025
	PRICE_OPENAI_PER_1K_OUTPUT: float = 0.001
	PRICE_GROQ_PER_1K_INPUT: float = 0.00011
	PRICE_GROQ_PER_1K_OUTPUT: float = 0.00034

	class Config:
		env_file = ".env" # noqa


settings = Settings()


# Uncomment what is below only for OCR test.

# # Choose the LLM model here (no .env needed for model)
# OPENAI_MODEL = "gpt-4o-mini"  # change here when you want a different model (e.g., "gpt-4o")

# def get_openai_model() -> str:
#     # Single source of truth for model selection
#     return OPENAI_MODEL
