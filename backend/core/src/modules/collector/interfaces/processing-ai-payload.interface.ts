import { AiProviderType, ProcessingType } from '@/common/enums';

export interface ProcessAiPayload {
  files?: Express.Multer.File[];
  processingType: ProcessingType;
  workflowId: string;
  aiProvider?: AiProviderType;
  text?: string;
}
