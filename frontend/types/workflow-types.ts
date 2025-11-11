export type WorkflowType = 'text' | 'audio' | 'image';

export interface BaseWorkflow {
  id: string;
  name: string;
  description: string;
  type: WorkflowType;
  status: 'active' | 'inactive' | 'archived';
  supportedLanguages: string[];
  enabledModes: WorkflowType[];
  workflowConfigurations: WorkflowConfiguration[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowConfiguration {
  id: string;
  type: 'dhis2' | 'postgres';
  configuration: Record<string, unknown>;
  isActive: boolean;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
