import { Roles } from '@/common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UpdateConfigurationDto, WorkflowConfigSummaryDto } from '../dto';
import { ConfigurationService } from '../services/configuration.service';

@Controller('workflows')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('/:workflowId/configurations')
  @Roles('admin')
  async getWorkflowConfigurations(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    const workflowConfig =
      await this.configurationService.getWorkflowConfigurations(workflowId);

    return plainToInstance(WorkflowConfigSummaryDto, workflowConfig, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('/configurations/:configId')
  @Roles('admin')
  async removeWorkflowConfiguration(
    @Param('configId', new ParseUUIDPipe()) configId: string,
  ) {
    await this.configurationService.removeWorkflowConfiguration(configId);
    return { message: 'Configuration removed successfully' };
  }

  @Put('/:workflowId/configurations')
  @Roles('admin')
  async upsertWorkflowConfigurations(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
    @Body() dto: { configurations: UpdateConfigurationDto[] },
  ) {
    return this.configurationService.upsertWorkflowConfigurations(
      workflowId,
      dto.configurations,
    );
  }
}
