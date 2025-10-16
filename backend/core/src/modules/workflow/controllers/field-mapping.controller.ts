import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Roles } from '@/common/decorators';
import { UpsertFieldMappingsDto } from '../dto';
import { FieldMappingService } from '../services/field-mapping.service';

@Controller('workflows')
export class FieldMappingController {
  constructor(private readonly fieldMappingService: FieldMappingService) {}

  @Get('/:workflowId/field-mappings')
  @Roles('admin')
  async getWorkflowFieldMappings(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    return this.fieldMappingService.getWorkflowFieldMappings(workflowId);
  }

  @Put('/:workflowId/field-mappings/upsert')
  @Roles('admin')
  async upsertFieldMappings(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
    @Body()
    dto: UpsertFieldMappingsDto,
  ) {
    await this.fieldMappingService.upsertFieldMappings(
      workflowId,
      dto.fieldMappings,
    );

    return {
      message: 'Field mappings upserted successfully',
    };
  }
}
