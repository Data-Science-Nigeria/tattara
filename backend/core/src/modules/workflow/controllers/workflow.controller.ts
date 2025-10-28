import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CurrentUser, Roles } from '@/common/decorators';
import {
  CreateWorkflowDto,
  UpdateWorkflowBasicDto,
  WorkflowResponseDto,
} from '../dto';
import { AssignUsersDto } from '../dto/assign-users.dto';
import { WorkflowService } from '../services/workflow.service';
import { User } from '@/database/entities';
import { ApiQuery } from '@nestjs/swagger';

@Controller('workflows')
@UseInterceptors(ClassSerializerInterceptor)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @Roles('admin', 'user')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getWorkflows(
    @CurrentUser() currentUser: User,
    @Query('userId') userId?: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.workflowService.getWorkflows(currentUser, userId, page, limit);
  }

  @Get('/search')
  @Roles('admin')
  async searchWorkflows(
    @Query('q') searchQuery: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.workflowService.searchWorkflows(searchQuery, page, limit);
  }

  @Get('/:workflowId')
  @Roles('admin')
  async findWorkflowById(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    const workflow = await this.workflowService.findWorkflowById(workflowId);

    return plainToInstance(WorkflowResponseDto, workflow, {
      excludeExtraneousValues: true,
    });
  }

  @Put('/:workflowId')
  @Roles('admin')
  async updateWorkflowBasicInfo(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
    @Body() updateData: UpdateWorkflowBasicDto,
  ) {
    return this.workflowService.updateWorkflowBasicInfo(workflowId, updateData);
  }

  @Put('/:workflowId')
  @Roles('admin')
  async archiveWorkflow(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    await this.workflowService.archiveWorkflow(workflowId);
    return {
      message: 'Workflow archived successfully',
    };
  }

  @Post()
  @Roles('admin')
  async createWorkflow(
    @Body()
    createWorkflowDto: CreateWorkflowDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.workflowService.createWorkflow(createWorkflowDto, currentUser);
  }

  @Post('/:workflowId/users')
  @Roles('admin')
  async assignUsersToWorkflow(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
    @Body() dto: AssignUsersDto,
  ) {
    return this.workflowService.assignUsersToWorkflow(workflowId, dto.userIds);
  }
}
