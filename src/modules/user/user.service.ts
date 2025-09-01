import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Role, Permission } from 'src/database/entities';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const userRole = await this.roleRepository.findOne({
      where: { name: 'user' },
    });

    const user = this.userRepository.create({
      ...userData,
      roles: userRole ? [userRole] : [],
    });

    return this.userRepository.save(user);
  }

  // tread carefully
  async deleteByEmail(email: string) {
    return await this.userRepository.delete({
      email,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });
  }

  async updateEmailVerification(
    userId: number,
    isVerified: boolean,
    token?: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: isVerified,
      emailVerificationToken: token || undefined,
    });
  }

  async updateEmailVerificationToken(
    userId: number,
    token: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
    });
  }

  async updateResetPasswordToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expiresAt,
    });
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
  }

  async assignRole(userId: number, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if user already has this role
    if (!user.hasRole(roleName)) {
      user.roles.push(role);
      return this.userRepository.save(user);
    }

    return user;
  }

  async removeRole(userId: number, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.roles = user.roles.filter(role => role.name !== roleName);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findAllWithPagination(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['roles', 'roles.permissions'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  // Role and Permission management methods
  async createRole(
    name: string,
    description: string,
    permissionIds?: number[],
  ): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    let permissions: Permission[] = [];
    if (permissionIds && permissionIds.length > 0) {
      permissions = await this.permissionRepository.findBy({
        id: In(permissionIds),
      });
    }

    const role = this.roleRepository.create({
      name,
      description,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async createPermission(
    name: string,
    description: string,
    resource: string,
    action: string,
  ): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { name },
    });

    if (existingPermission) {
      throw new ConflictException('Permission with this name already exists');
    }

    const permission = this.permissionRepository.create({
      name,
      description,
      resource,
      action,
    });

    return this.permissionRepository.save(permission);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
    });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }
}
