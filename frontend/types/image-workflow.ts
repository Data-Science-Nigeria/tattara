import { BaseWorkflow } from './workflow-types';

export interface ImageWorkflow extends BaseWorkflow {
  type: 'image';
  ocrEnabled: boolean;
  maxFileSize: number;
  allowedFormats: string[];
}
