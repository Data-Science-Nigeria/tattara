import { mode, WorkflowStatus } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.INACTIVE,
  })
  status: WorkflowStatus;

  @Column({ type: 'array', default: [] })
  supportedLanguages: string[];

  @Column({
    type: 'enum',
    enum: mode,
    array: true,
    default: [mode.TEXT],
  })
  enabledModes: mode[];

  @ManyToOne(() => Program, program => program.workflows)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;
}
