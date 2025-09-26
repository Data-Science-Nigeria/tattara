import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { IntegrationType } from 'src/common/enums';
import type { ConnectionDto } from '../dto/connection.dto';
import { IntegrationService } from '../services/integration.service';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('test-connection')
  async testConnection(@Body() connection: ConnectionDto): Promise<any> {
    return this.integrationService.testConnection(connection);
  }

  @Post('schemas')
  async fetchSchemas(@Body() connection: ConnectionDto): Promise<any> {
    return this.integrationService.fetchSchemas(connection);
  }

  // @Post('push')
  // async pushData(@Body() body: PushDataDto): Promise<any> {
  //   return this.integrationService.pushData(body.connection, body.payload);
  // }

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
