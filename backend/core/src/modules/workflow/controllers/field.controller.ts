import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators';
import { UpsertWorkflowFieldsDto } from '../dto';
import { FieldService } from '../services/field.service';

@Controller('workflows')
export class FieldController {
  constructor(private readonly fieldService: FieldService) {}

  @Get('/:workflowId/fields')
  @Roles('admin')
  async getWorkflowFields(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    return this.fieldService.getWorkflowFields(workflowId);
  }

  @Put('/:workflowId/fields/upsert')
  @Roles('admin')
  async upsertWorkflowFields(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
    @Body()
    dto: UpsertWorkflowFieldsDto,
  ) {
    await this.fieldService.upsertWorkflowFields(workflowId, dto.fields);

    return {
      message: 'Fields upserted successfully',
    };
  }

  @Delete('/fields/:fieldId')
  @Roles('admin')
  async removeWorkflowField(
    @Param('fieldId', new ParseUUIDPipe()) fieldId: string,
  ) {
    await this.fieldService.removeWorkflowField(fieldId);
    return {
      message: 'Field remove successfully',
    };
  }
}
