export enum AiProviderType {
  // OpenAI
  GPT4o = 'gpt-4o',
  GPT4oMini = 'gpt-4o-mini',
  GPT4_1 = 'gpt-4.1',
  GPT4_1Mini = 'gpt-4.1-mini',
  GPT4_Turbo = 'gpt-4-turbo',
  GPT35_Turbo = 'gpt-3.5-turbo',
  GPT5 = 'gpt-5',

  // Anthropic
  CLAUDE_OPUS_45 = 'claude-opus-4.5',
  CLAUDE_SONNET_35 = 'claude-3.5-sonnet',
  CLAUDE_HAIKU_35 = 'claude-3.5-haiku',

  // Google Gemini
  GEMINI_20_FLASH = 'gemini-2.0-flash',
  GEMINI_20_PRO = 'gemini-2.0-pro',
  GEMINI_15_FLASH = 'gemini-1.5-flash',
  GEMINI_15_PRO = 'gemini-1.5-pro',

  // Meta
  LLAMA_31 = 'llama-3.1',
  LLAMA_31_70B = 'llama-3.1-70b',
  LLAMA_31_405B = 'llama-3.1-405b',

  // Mistral AI
  MISTRAL_LARGE = 'mistral-large',
  MISTRAL_NEMO = 'mistral-nemo',
  MISTRAL_SMALL = 'mistral-small',
  MISTRAL_TINY = 'mistral-tiny',

  //GROQ
  GROQ_5_TURBO = 'groq-5-turbo',
  GROQ_LLAMA_MAVERICK = 'groq-llama-maverick',
  GROQ_LLAMA_SCOUT = 'groq-llama-scout',
  GROQ_QWEN3_32B = 'groq-qwen3-32b',

  // xAI
  GROK_2 = 'grok-2',
  GROK_2_MINI = 'grok-2-mini',

  // Custom / Internal Models
  CUSTOM = 'custom',
  EXPERIMENTAL = 'experimental',
}
