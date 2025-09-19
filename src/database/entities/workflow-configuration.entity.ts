import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { IntegrationType } from 'src/common/enums';
import { ExternalConnection } from './external-connections.entity';
import type { WorkflowConfigurationData } from 'src/common/interfaces';

@Entity('workflow_configurations')
export class WorkflowConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow, workflow => workflow.workflowConfigurations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({
    type: 'enum',
    enum: IntegrationType,
    default: IntegrationType.DHIS2,
  })
  type: IntegrationType;

  @OneToOne(() => ExternalConnection)
  @JoinColumn({ name: 'external_connection_id' })
  externalConnection: ExternalConnection;

  @Column({ type: 'jsonb' })
  configuration: WorkflowConfigurationData;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
