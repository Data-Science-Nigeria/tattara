import { IntegrationType } from '@/common/enums';
import type { WorkflowConfigurationData } from '@/common/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExternalConnection, User, Workflow } from '.';

@Entity('workflow_configurations', {
  orderBy: {
    createdAt: 'DESC',
  },
})
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

  @ManyToOne(
    () => ExternalConnection,
    externalConn => externalConn.workflowConfigurations,
    { eager: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'external_connection_id' })
  externalConnection: ExternalConnection;

  @Column({ type: 'jsonb' })
  configuration: WorkflowConfigurationData;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
