export type WorkflowType = 'form' | 'text' | 'audio' | 'image';

export interface BaseWorkflow {
  id: string;
  name: string;
  programId: string;
  type: WorkflowType;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}
