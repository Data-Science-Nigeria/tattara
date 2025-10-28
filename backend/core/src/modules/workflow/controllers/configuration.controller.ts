import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser, Roles } from '@/common/decorators';
import { ConfigurationService } from '../services/configuration.service';
import { UpdateConfigurationDto, WorkflowConfigSummaryDto } from '../dto';
import { User } from '@/database/entities';
import { plainToInstance } from 'class-transformer';

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
    @CurrentUser() currentUser: User,
  ) {
    await this.configurationService.removeWorkflowConfiguration(
      configId,
      currentUser,
    );
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
