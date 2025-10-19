import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { User } from '.';

@Entity('programs')
@Unique(['createdBy', 'name'])
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => Workflow, workflow => workflow.program)
  workflows: Workflow[];

  @ManyToMany(() => User, user => user.programs)
  users: User[];

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
