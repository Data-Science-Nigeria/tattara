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

// {
//   "form_id": "string",
//   "form_version": "string",
//   "total_rows": 0,
//   "rows": [
//     {
//       "row_index": 0,
//       "extracted": {
//         "additionalProp1": {}
//       },
//       "missing_required": [
//         "string"
//       ]
//     }
//   ],
//   "confidence": {
//     "additionalProp1": 0,
//     "additionalProp2": 0,
//     "additionalProp3": 0
//   },
//   "metrics": {
//     "asr_seconds": 0,
//     "vision_seconds": 0,
//     "llm_seconds": 0,
//     "total_seconds": 0,
//     "tokens_in": 0,
//     "tokens_out": 0,
//     "cost_usd": 0,
//     "provider": "string",
//     "model": "string"
//   },
//   "meta": {
//     "additionalProp1": {}
//   }
// }

export interface ExtractionRow {
  row_index: number;
  extracted: Record<string, any>;
  spans: Record<string, any>;
  missing_required: string[];
}

export interface Metrics {
  total_seconds?: number;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  provider?: string;
  model?: string;
  asr_seconds?: number;
  vision_seconds?: number;
  llm_seconds?: number;
}

export interface ExtractionResponse {
  form_id: string;
  form_version?: string;
  total_rows: number;
  rows: ExtractionRow[];
  confidence: Record<string, number>;
  metrics: Metrics;
  meta: Record<string, any>;
}
