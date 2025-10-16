import { IntegrationType } from '@/common/enums';
import type { ExternalConnectionConfiguration } from '@/common/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User, WorkflowConfiguration } from '.';

@Entity('external_connections')
@Unique(['createdBy', 'name'])
export class ExternalConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: IntegrationType })
  type: IntegrationType;

  @Column({ type: 'jsonb' })
  configuration: ExternalConnectionConfiguration;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTestedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  testResult?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => WorkflowConfiguration, wConfig => wConfig.externalConnection)
  workflowConfigurations: WorkflowConfiguration;

  @ManyToOne(() => User, user => user.externalConnections, {
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
