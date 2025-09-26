import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, RequirePermissions, Roles } from 'src/common/decorators';
import { PermissionsGuard, RolesGuard } from 'src/common/guards';
import { CsvUsersValidationPipe } from 'src/common/pipes';
import { User } from 'src/database/entities';
import { RegisterDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @RequirePermissions('user:read')
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      roles:
        user.roles?.map(role => ({
          name: role.name,
          description: role.description,
          permissions: role.permissions?.map(p => p.name) || [],
        })) || [],
      permissions: user.getAllPermissions(),
      createdAt: user.createdAt,
    };
  }

  @Get('all')
  @Roles('super-admin')
  @RequirePermissions('user:read')
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    const { users, total } = await this.userService.findAllWithPagination(
      page,
      limit,
    );

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        roles: user.roles?.map(role => role.name) || [],
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get()
  @Roles('admin')
  @RequirePermissions('user:read')
  async findAllForLoggedInUser(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @CurrentUser() currentUser: User,
  ) {
    const { users, total } =
      await this.userService.findAllForLoggedInUserWithPagination(
        page,
        limit,
        currentUser,
      );

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        roles: user.roles?.map(role => role.name) || [],
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Post(':id/roles/:roleName')
  @Roles('admin')
  @RequirePermissions('user:write')
  async assignRole(
    @Param('id') userId: string,
    @Param('roleName') roleName: string,
  ) {
    const user = await this.userService.assignRole(userId, roleName);
    return {
      message: `Role ${roleName} assigned successfully`,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles?.map(role => role.name) || [],
      },
    };
  }

  @Get('roles')
  @Roles('admin')
  @RequirePermissions('role:read')
  async getAllRoles() {
    const roles = await this.userService.findAllRoles();
    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions:
        role.permissions?.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
        })) || [],
    }));
  }

  @Roles('admin')
  @Post('single-register')
  @HttpCode(HttpStatus.CREATED)
  async registerSingleUser(
    @Body() registerDto: RegisterDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.registerSingleUser(registerDto, user);
  }

  @Post('bulk/create')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('admin')
  @RequirePermissions('user:write')
  async bulkCreate(
    @UploadedFile(CsvUsersValidationPipe) userBatch: { users: RegisterDto[] },
    @CurrentUser() admin: User,
  ) {
    await this.userService.bulkCreate(admin, userBatch.users);
    return {
      message: `Users successfully created`,
    };
  }

  @Get('permissions')
  @Roles('admin')
  @RequirePermissions('permission:read')
  async getAllPermissions() {
    return this.userService.findAllPermissions();
  }
}
