import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User, Workflow } from '.';
import { ProcessingStatus, ProcessingType } from '@/common/enums';

@Entity('ai_processing_logs')
export class AiProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.aiProcessingLogs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workflow, workflow => workflow.workflowFields, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({
    type: 'enum',
    enum: ProcessingType,
    nullable: true,
  })
  processingType: ProcessingType;

  @Column({ type: 'uuid', array: true, default: '{}' })
  inputFileIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  formSchema: Record<string, any>;

  @Column({ nullable: true, type: 'text' })
  inputText: string;

  @Column({ type: 'jsonb', nullable: true })
  mappedOutput: Record<string, any>;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
    nullable: true,
  })
  confidenceScore: number;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
    nullable: true,
  })
  processingTimeMs: number;

  @Column({ nullable: true })
  aiProvider: string;

  @Column({ nullable: true })
  aiModelVersion: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  status: ProcessingStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;
}
