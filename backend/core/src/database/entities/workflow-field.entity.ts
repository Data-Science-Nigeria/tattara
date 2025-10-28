import { FieldType } from '@/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User, Workflow } from '.';
import { FieldMapping } from './field-mapping.entity';

@Entity('workflow_fields')
export class WorkflowField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Workflow, workflow => workflow.workflowFields, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @Column()
  fieldName: string;

  @Column()
  label: string;

  @Column({
    type: 'enum',
    enum: FieldType,
    default: FieldType.TEXT,
  })
  fieldType: FieldType;

  @Column({ type: 'text', array: true, nullable: true })
  options?: string[];

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationRules: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  aiMapping: Record<string, any>;

  @Column()
  displayOrder: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FieldMapping, fieldMapping => fieldMapping.workflowField, {
    cascade: true,
  })
  fieldMappings: FieldMapping[];
}
