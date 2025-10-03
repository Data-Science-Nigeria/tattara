import { IntegrationType } from 'src/common/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User, WorkflowConfiguration } from '.';
import type { ExternalConnectionConfiguration } from 'src/common/interfaces';

@Entity('external_connections')
export class ExternalConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
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
  workflowConfiguration: WorkflowConfiguration;

  @ManyToOne(() => User, user => user.externalConnections, {
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}
