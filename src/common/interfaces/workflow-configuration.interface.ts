export interface Dhis2WorkflowConfig {
  orgUnitId: string;
  programId: string;
  programStageId: string;
}

export interface GenericWorkflowConfig {
  [key: string]: any;
}

export type WorkflowConfigurationData =
  | Dhis2WorkflowConfig
  | GenericWorkflowConfig;
