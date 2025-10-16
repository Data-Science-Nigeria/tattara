import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Roles } from '@/common/decorators';
import { ConfigurationService } from '../services/configuration.service';
import { UpdateConfigurationDto } from '../dto';

@Controller('workflows')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get('/:workflowId/configurations')
  @Roles('admin')
  async getWorkflowConfigurations(
    @Param('workflowId', new ParseUUIDPipe()) workflowId: string,
  ) {
    return this.configurationService.getWorkflowConfigurations(workflowId);
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
