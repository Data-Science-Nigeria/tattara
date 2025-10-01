import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConnectionDto, GetSchemasQueryDto } from '../dto';
import { IntegrationService } from '../services/integration.service';
import { GetOrgUnitsQueryDto } from '../dto/get-orgunits-query.dto';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /**  Confirm connection
   */
  @Post('test-connection')
  async testConnection(@Body() connection: ConnectionDto): Promise<any> {
    await this.integrationService.testConnection(connection);

    return {
      message: 'Connection ok',
    };
  }

  /**  Fetch schemas
   */
  @Get(':connectionId/schemas')
  async fetchSchemas(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
    @Query() query: GetSchemasQueryDto,
  ): Promise<any> {
    return this.integrationService.fetchSchemas(connId, {
      id: query.id,
      type: query.type,
    });
  }

  @Get('dhis2/programs/:connectionId')
  async getPrograms(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
  ): Promise<any> {
    return this.integrationService.getPrograms(connId);
  }

  @Get('dhis2/datasets/:connectionId')
  async getDatasets(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
  ): Promise<any> {
    return this.integrationService.getDatasets(connId);
  }

  @Get('dhis2/:connectionId/orgunits')
  async getOrgUnits(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
    @Query() query: GetOrgUnitsQueryDto,
  ): Promise<any> {
    return this.integrationService.getOrgUnits(connId, {
      id: query.id,
      type: query.type,
    });
  }
}
