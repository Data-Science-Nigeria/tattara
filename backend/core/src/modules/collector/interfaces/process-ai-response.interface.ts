import { ExtractionResponse } from '@/modules/ai/interfaces';

export interface ProcessAiResponse {
  aiData: ExtractionResponse;
  aiProcessingLogId: string;
}
