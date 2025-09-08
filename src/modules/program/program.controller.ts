import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProgramService } from './program.service';
import { RequirePermissions, Roles } from 'src/common/decorators';
import { CreateProgramDto } from './dto';
import { UpdateProgramDto } from './dto';

@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Get('programs')
  @Roles('admin')
  @RequirePermissions('program:read')
  findAll() {
    return this.programService.findAll();
  }

  @Post('programs')
  @Roles('admin')
  @RequirePermissions('program:create')
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programService.create(createProgramDto);
  }

  @Get('programs/:id')
  @Roles('admin')
  @RequirePermissions('program:read')
  findOne(@Param('id', ParseIntPipe) programId: string) {
    return this.programService.findOne(programId);
  }

  @Patch('programs/:id')
  @Roles('admin')
  @RequirePermissions('program:update')
  update(
    @Param('id', ParseIntPipe) programId: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programService.update(programId, updateProgramDto);
  }

  @Delete('programs/:id')
  @Roles('admin')
  @RequirePermissions('program:delete')
  remove(@Param('id', ParseIntPipe) programId: string) {
    return this.programService.remove(programId);
  }

  @Get('programs/paginated')
  @Roles('admin')
  @RequirePermissions('program:read')
  findAllWithPagination(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.programService.findAllWithPagination(page, limit);
  }

  @Get('programs/:id/workflows')
  @Roles('admin')
  @RequirePermissions('program:read')
  findWorkflowsByProgram(@Param('id', ParseIntPipe) programId: string) {
    return this.programService.findAllWorkflows(programId);
  }

  @Post('programs/:id/workflows')
  @Roles('admin')
  @RequirePermissions('program:update')
  addWorkflowToProgram(
    @Param('id', ParseIntPipe) programId: string,
    @Body('workflowId', ParseIntPipe) workflowIds: string[],
  ) {
    return this.programService.addWorkflowToProgram(programId, workflowIds);
  }
}
