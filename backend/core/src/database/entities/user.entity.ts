import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role, Workflow, AiProcessingLog, Program } from '.';
import { ExternalConnection } from './external-connection.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  @Column({ default: false })
  forcePasswordReset: boolean;

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Program, program => program.users)
  @JoinTable({
    name: 'user_programs',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'program_id', referencedColumnName: 'id' },
  })
  programs: Program[];

  @ManyToMany(() => Workflow, workflow => workflow.users, { eager: true })
  @JoinTable({
    name: 'user_workflow_assignments',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'workflow_id', referencedColumnName: 'id' },
  })
  workflows: Workflow[];

  @Column({ default: false })
  isFirstLogin: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @ManyToOne(() => User, user => user.createdUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  createdBy?: User;

  @OneToMany(() => User, user => user.createdBy)
  createdUsers: User[];

  @OneToMany(() => AiProcessingLog, aiProcessingLog => aiProcessingLog.user)
  aiProcessingLogs: AiProcessingLog[];

  @OneToMany(() => ExternalConnection, connection => connection.createdBy)
  externalConnections: ExternalConnection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some(role => role.name === roleName) || false;
  }

  hasPermission(permissionName: string): boolean {
    if (!this.roles) return false;

    return this.roles.some(role =>
      role.permissions?.some(permission => permission.name === permissionName),
    );
  }

  getAllPermissions(): string[] {
    if (!this.roles) return [];

    const permissions = new Set<string>();
    this.roles.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.add(permission.name);
      });
    });

    return Array.from(permissions);
  }
}
