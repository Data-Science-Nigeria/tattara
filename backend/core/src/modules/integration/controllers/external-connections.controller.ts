import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { ExternalConnectionService } from '../services/external-connections.service';
import { ExternalConnection, User } from '@/database/entities';
import { CurrentUser, Roles } from '@/common/decorators';
import { CreateConnectionDto } from '../dto';

@Controller('external-connections')
export class ExternalConnectionsController {
  constructor(
    private readonly externalConnService: ExternalConnectionService,
  ) {}

  @Post()
  @Roles('admin')
  async create(
    @Body() data: CreateConnectionDto,
    @CurrentUser() currentUser: User,
  ) {
    const conn = await this.externalConnService.createByUser(data, currentUser);
    return {
      id: conn.id,
      name: conn.name,
      type: conn.type,
      configuration: conn.configuration,
      isActive: conn.isActive,
      lastTested: conn.lastTestedAt,
      testResult: conn.testResult,
      updatedAt: conn.updatedAt,
      createdAt: conn.createdAt,
    };
  }

  @Get()
  @Roles('admin')
  async findAll(@CurrentUser() currentUser: User) {
    return this.externalConnService.findAll(currentUser);
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.externalConnService.findOneByUser(id, currentUser);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
    @Body() data: Partial<ExternalConnection>,
  ) {
    return this.externalConnService.update(id, currentUser, data);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.externalConnService.remove(id, currentUser);
  }
}
