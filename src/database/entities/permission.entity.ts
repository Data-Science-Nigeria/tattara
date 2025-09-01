import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  resource: string; // e.g., 'user', 'role', 'report'

  @Column()
  action: string; // e.g., 'read', 'write', 'delete'

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
}
