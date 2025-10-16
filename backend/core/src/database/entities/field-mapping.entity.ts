import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workflow, WorkflowField } from '.';
import { IntegrationType } from '@/common/enums';

@Entity('field_mappings')
@Unique(['workflow', 'workflowField', 'targetType'])
export class FieldMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow, workflow => workflow.fieldMappings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @ManyToOne(
    () => WorkflowField,
    workflowField => workflowField.fieldMappings,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'workflow_field_id' })
  workflowField: WorkflowField;

  @Column({
    type: 'enum',
    enum: IntegrationType,
    default: IntegrationType.DHIS2,
  })
  targetType: IntegrationType;

  @Column({ type: 'jsonb' })
  target: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
