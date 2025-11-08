import { BaseWorkflow } from './workflow-types';

export interface TextWorkflow extends BaseWorkflow {
  type: 'text';
  prompt: string;
  maxLength?: number;
  aiProcessing: boolean;
}
