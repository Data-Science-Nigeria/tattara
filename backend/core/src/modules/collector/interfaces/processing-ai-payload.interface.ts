import { AiProviderType, ProcessingType } from 'src/common/enums';

export interface ProcessAiPayload {
  files?: Express.Multer.File[];
  processingType: ProcessingType;
  workflowId: string;
  aiProvider?: AiProviderType;
  text?: string;
}
