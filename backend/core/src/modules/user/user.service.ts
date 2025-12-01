import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import * as crypto from 'crypto';
import { Permission, Role, User } from '@/database/entities';
import { DataSource, In, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private dataSource: DataSource,
    @InjectQueue('mail') private mailQueue: Queue,
    private configService: ConfigService,
  ) {}

  async create(userData: Partial<User>, createdBy?: User): Promise<User> {
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
      ...(createdBy ? { createdBy: createdBy } : {}),
      roles: userRole ? [userRole] : [],
    });

    return this.userRepository.save(user);
  }

  async registerSingleUser(registerDto: RegisterDto, createdBy: User) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(
        Date.now() +
          (this.configService.get<number>(
            'app.passwordResetExpiresIn',
          ) as number),
      );

      const userData = {
        ...registerDto,
        createdBy,
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      };

      const user = await this.create(userData);

      const frontendUrl = this.configService.get<string>('app.frontendUrl');

      await this.mailQueue.add(
        'sendEmail',
        {
          to: user.email,
          subject: 'Reset your password',
          template: 'bulk-creation-user-password-reset',
          context: {
            firstName: user.firstName,
            email: user.email,
            appName: this.configService.get<string>('app.name'),
            resetUrl: `${frontendUrl}/auth/reset-password?token=${resetToken}`,
          },
        },
        {
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        message: 'Registration successful. Email sent to user.',
        userId: user.id,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.log('Error occurred during registration:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async bulkCreate(createdBy: User, usersData: Partial<User>[]) {
    const emails = usersData.map(u => u.email);

    const existing = await this.userRepository.find({
      where: { email: In(emails) },
    });

    if (existing.length > 0) {
      throw new BadRequestException({
        message: 'Some emails are already in use',
        errors: { existingEmails: existing.map(u => u.email) },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userRole = await this.roleRepository.findOne({
        where: { name: 'user' },
      });

      for (const userData of usersData) {
        const user = new User();

        const resetToken = crypto.randomBytes(32).toString('hex');

        const resetExpires = new Date(
          Date.now() +
            (this.configService.get<number>(
              'app.passwordResetExpiresIn',
            ) as number),
        );

        user.firstName = userData.firstName as string;
        user.lastName = userData.lastName as string;
        user.email = userData.email as string;
        user.password = userData.password ?? 'DefaultPassword12';
        user.createdBy = createdBy;
        user.forcePasswordReset = true;
        user.roles = userRole ? [userRole] : [];
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;

        await queryRunner.manager.save(user);

        const frontendUrl = this.configService.get<string>('app.frontendUrl');

        // TODO: Remove await so user can get response immediately the queue will handle this
        await this.mailQueue.add(
          'sendEmail',
          {
            to: user.email,
            subject: 'Reset your password',
            template: 'bulk-creation-user-password-reset',
            context: {
              firstName: user.firstName,
              email: user.email,
              appName: this.configService.get<string>('app.name'),
              resetUrl: `${frontendUrl}/auth/reset-password?token=${resetToken}`,
            },
          },
          {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

  async findById(id: string): Promise<User | null> {
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
    userId: string,
    isVerified: boolean,
    token?: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      isEmailVerified: isVerified,
      emailVerificationToken: token || undefined,
    });
  }

  async updateEmailVerificationToken(
    userId: string,
    token: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      emailVerificationToken: token,
    });
  }

  async updateResetPasswordToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expiresAt,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        password: hashedPassword,
        resetPasswordToken: () => 'NULL',
        resetPasswordExpires: () => 'NULL',
        forcePasswordReset: false,
        isEmailVerified: true,
      })
      .where('id = :userId', { userId })
      .execute();
  }

  async assignRole(userId: string, roleName: string): Promise<User> {
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

  async removeRole(userId: string, roleName: string): Promise<User> {
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

  async findAllForLoggedInUserWithPagination(
    page: number = 1,
    limit: number = 10,
    currentUser: User,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { createdBy: { id: currentUser.id } },
      relations: ['roles', 'roles.permissions'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
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
