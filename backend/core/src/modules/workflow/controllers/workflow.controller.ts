import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators';
import { CreateWorkflowDto, UpdateWorkflowBasicDto } from '../dto';
import { AssignUsersDto } from '../dto/assign-users.dto';
import { WorkflowService } from '../services/workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @Roles('admin')
  async findAllWorkflows(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.workflowService.findWorkflowsWithPagination(page, limit);
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
    return this.workflowService.findWorkflowById(workflowId);
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
  ) {
    return this.workflowService.createWorkflow(createWorkflowDto);
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
