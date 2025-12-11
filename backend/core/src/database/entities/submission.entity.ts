import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User, Workflow } from '.';
import { SubmissionStatus } from '@/common/enums';

export interface SubmissionMetadata {
  source: string;
  aiProcessingId: string;
  confidenceScore: number;
  originalAudioFieldId: string;
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: Submission need not to be deleted on user deletion, consider changing cascade behavior
  @ManyToOne(() => User, user => user.submissions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // TODO: Submission need not to be deleted on workflow deletion, consider changing cascade behavior
  @ManyToOne(() => Workflow, workflow => workflow.workflowFields, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column({ type: 'uuid', nullable: true })
  localId: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: SubmissionMetadata;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ type: 'jsonb', nullable: true })
  validationErrors: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  submittedAt: Date;
}
