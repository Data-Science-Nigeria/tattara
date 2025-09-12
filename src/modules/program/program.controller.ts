import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { RequirePermissions, Roles } from 'src/common/decorators';
import { CreateProgramDto } from './dto';
import { UpdateProgramDto } from './dto';

@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('program:read')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const { programs, total } = await this.programService.findAllWithPagination(
      page,
      limit,
    );

    return {
      programs: programs.map(program => ({
        id: program.id,
        name: program.name,
        description: program.description,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('program:create')
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programService.create(createProgramDto);
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('program:read')
  findOne(@Param('id') programId: string) {
    return this.programService.findOne(programId);
  }

  @Patch(':id')
  @Roles('admin')
  @RequirePermissions('program:update')
  update(
    @Param('id') programId: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programService.update(programId, updateProgramDto);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('program:delete')
  remove(@Param('id') programId: string) {
    return this.programService.remove(programId);
  }

  @Get(':id/workflows')
  @Roles('admin')
  @RequirePermissions('program:read')
  findWorkflowsByProgram(@Param('id') programId: string) {
    return this.programService.findAllWorkflows(programId);
  }

  @Post(':id/workflows')
  @Roles('admin')
  @RequirePermissions('program:update')
  addWorkflowToProgram(
    @Param('id') programId: string,
    @Body('workflowId') workflowIds: string[],
  ) {
    return this.programService.addWorkflowToProgram(programId, workflowIds);
  }
}
