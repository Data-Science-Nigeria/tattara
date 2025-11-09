import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { CurrentUser, RequirePermissions, Roles } from '@/common/decorators';
import { AssignUsersToProgramDto, CreateProgramDto } from './dto';
import { UpdateProgramDto } from './dto';
import { User } from '@/database/entities';
import { ApiQuery } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ProgramResponseDto } from './dto/program-response.dto';

@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  /**  Get all programs with pagination
   */
  @Get()
  @Roles('admin')
  @RequirePermissions('program:read')
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getPrograms(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() currentUser: User,
    @Query('userId') userId?: string,
  ) {
    const { programs, total } = await this.programService.getPrograms(
      page,
      limit,
      currentUser,
      userId,
    );

    return {
      programs: plainToInstance(ProgramResponseDto, programs, {
        excludeExtraneousValues: true,
      }),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /** Create a new program
   */
  @Post()
  @Roles('admin')
  @RequirePermissions('program:create')
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programService.create(createProgramDto);
  }

  /** Get a specific program by ID
   */
  @Get(':id')
  @Roles('admin')
  @RequirePermissions('program:read')
  findOne(@Param('id') programId: string) {
    return this.programService.findOne(programId);
  }

  /** Update a specific program by ID
   */
  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('program:update')
  update(
    @Param('id') programId: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programService.update(programId, updateProgramDto);
  }

  /** Delete a specific program by ID
   */
  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('program:delete')
  remove(@Param('id') programId: string) {
    return this.programService.remove(programId);
  }

  /** Get all workflows associated with a specific program
   */
  @Get(':id/workflows')
  @Roles('admin')
  @RequirePermissions('program:read')
  findWorkflowsByProgram(@Param('id') programId: string) {
    return this.programService.findAllWorkflows(programId);
  }

  /** Associate multiple workflows with a specific program
   */
  @Post(':id/workflows')
  @Roles('admin')
  @RequirePermissions('program:update')
  addWorkflowToProgram(
    @Param('id') programId: string,
    @Body('workflowIds') workflowIds: string[],
  ) {
    return this.programService.addWorkflowToProgram(programId, workflowIds);
  }

  /** Get all programs associated with a specific user
   */
  @Get(':userId/users')
  @Roles('admin')
  @RequirePermissions('program:read')
  async getAllProgramsForUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    const programs = await this.programService.getAllProgramsForUser(userId);
    return {
      programs: programs.map(program => ({
        id: program.id,
        name: program.name,
        description: program.description,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      })),
    };
  }

  /** Assign multiple users to a specific program
   */
  @Post(':id/users')
  @Roles('admin')
  @RequirePermissions('program:update')
  assignUsersToProgram(
    @Param('id', new ParseUUIDPipe()) programId: string,
    @Body() dto: AssignUsersToProgramDto,
  ) {
    // return this.programService.assignUsersToProgram(dto.userIds, programId);
    const program = this.programService.assignUsersToProgram(
      dto.userIds,
      programId,
    );
    return plainToInstance(ProgramResponseDto, program, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/users/unassign')
  @Roles('admin')
  @RequirePermissions('program:update')
  unassignUsersFromProgram(
    @Param('id', new ParseUUIDPipe()) programId: string,
    @Body() dto: AssignUsersToProgramDto,
  ) {
    return this.programService.unassignUsersFromProgram(dto.userIds, programId);
  }
}
