import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IntegrationType } from 'src/common/enums';
import { ConnectionDto } from '../dto';
import { IntegrationService } from '../services/integration.service';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('test-connection')
  async testConnection(@Body() connection: ConnectionDto): Promise<any> {
    await this.integrationService.testConnection(connection);

    return {
      message: 'Connection ok',
    };
  }

  @Get(':connectionId/schemas')
  async fetchSchemas(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
  ): Promise<any> {
    return this.integrationService.fetchSchemas(connId);
  }

  // DHIS2 specific endpoints
  @Post('dhis2/programs')
  async getPrograms(@Body() connection: ConnectionDto): Promise<any> {
    if (
      connection.type !== IntegrationType.DHIS2 ||
      !('baseUrl' in connection.config)
    ) {
      throw new BadRequestException('Invalid DHIS2 connection configuration');
    }
    // Now safe to cast
    return this.integrationService.getPrograms({
      type: connection.type,
      config: connection.config,
    });
  }
}
