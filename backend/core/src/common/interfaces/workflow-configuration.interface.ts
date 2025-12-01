import { EventPayload, DatasetPayload } from '@/modules/integration/interfaces';

export type Dhis2WorkflowConfig = EventPayload | DatasetPayload;

export interface GenericWorkflowConfig {
  schema: string;
  table: string;
  [key: string]: any;
}

export type WorkflowConfigurationData =
  | Dhis2WorkflowConfig
  | GenericWorkflowConfig;
