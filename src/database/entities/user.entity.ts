import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

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
