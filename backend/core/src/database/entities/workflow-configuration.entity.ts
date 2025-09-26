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
import { IntegrationType } from 'src/common/enums';
import type { WorkflowConfigurationData } from 'src/common/interfaces';
import { ExternalConnection, Workflow } from '.';

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

  @OneToOne(
    () => ExternalConnection,
    externalConn => externalConn.workflowConfiguration,
    { eager: true },
  )
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
