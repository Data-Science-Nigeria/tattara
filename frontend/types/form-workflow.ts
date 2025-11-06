import { BaseWorkflow } from './workflow-types';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface FormWorkflow extends BaseWorkflow {
  type: 'form';
  fields: FormField[];
}
