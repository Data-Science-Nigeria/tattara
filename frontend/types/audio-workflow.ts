import { BaseWorkflow } from './workflow-types';

export interface AudioWorkflow extends BaseWorkflow {
  type: 'audio';
  maxDuration: number;
  transcriptionEnabled: boolean;
  languages: string[];
}
