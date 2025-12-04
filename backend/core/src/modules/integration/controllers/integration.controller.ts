import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ConnectionDto,
  GetDatasetsQueryDto,
  GetProgramsQueryDto,
  GetSchemasQueryDto,
} from '../dto';
import { IntegrationService } from '../services/integration.service';
import { GetOrgUnitsQueryDto } from '../dto/get-orgunits-query.dto';
import { Roles } from '@/common/decorators';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  /**  Confirm connection
   */
  @Post('test-connection')
  async testConnection(@Body() connection: ConnectionDto): Promise<any> {
    return this.integrationService.testConnection(connection);
  }

  /**  Fetch schemas
   */
  @Get(':connectionId/schemas')
  @Roles('super-admin', 'admin')
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
  @Roles('super-admin', 'admin')
  async getPrograms(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
    @Query() query: GetProgramsQueryDto,
  ): Promise<any> {
    return this.integrationService.getPrograms(connId, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    });
  }

  @Get('dhis2/datasets/:connectionId')
  @Roles('super-admin', 'admin')
  async getDatasets(
    @Param('connectionId', new ParseUUIDPipe()) connId: string,
    @Query() query: GetDatasetsQueryDto,
  ): Promise<any> {
    return this.integrationService.getDatasets(connId, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    });
  }

  @Get('dhis2/:connectionId/orgunits')
  @Roles('super-admin', 'admin')
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
