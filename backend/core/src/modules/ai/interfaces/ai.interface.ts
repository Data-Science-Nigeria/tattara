export interface FormSchema {
  id: string;
  type: string;
  required: boolean;
  pattern?: string;
}

export interface ProcessTextPayload {
  form_id: string;
  form_schema: { fields: FormSchema[] };
  text: string;
  provider_preference?: string | null;
}

export interface ProcessAudioPayload {
  form_id: string;
  form_schema: { fields: FormSchema[] };
  language?: string;
  provider_preference?: string | null;
  audio_file: Buffer;
}

export interface ProcessImagePayload {
  form_id: string;
  form_schema: { fields: FormSchema[] };
  provider_preference?: string | null;
  images: Express.Multer.File[];
  language?: string;
}

export interface ExtractionResponse {
  form_id: string;
  form_version?: string;
  extracted: Record<string, any>;
  spans: Record<string, any>;
  missing_required: string[];
  confidence: Record<string, number>;
  metrics?: {
    total_seconds?: number;
    tokens_in?: number;
    tokens_out?: number;
    cost_usd?: number;
    provider?: string;
    model?: string;
    asr_seconds?: number;
    vision_seconds?: number;
    llm_seconds?: number;
  };
}
