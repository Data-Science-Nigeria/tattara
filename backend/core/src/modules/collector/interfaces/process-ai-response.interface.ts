import { ExtractionResponse } from 'src/modules/ai/interfaces';

export interface ProcessAiResponse {
  aiData: ExtractionResponse;
  aiProcessingLogId: string;
}
