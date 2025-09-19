import { Controller, Post, Body } from '@nestjs/common';
import { IntegrationService } from '../services/integration.service';
import type { ConnectionDto, PushDataDto } from '../dto/connection.dto';

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
    
    @Post('push')
    async pushData(@Body() body: PushDataDto): Promise<any> {
        return this.integrationService.pushData(body.connection, body.payload);
    }

    // DHIS2 specific endpoints
    @Post('dhis2/programs')
    async getPrograms(@Body() connection: ConnectionDto): Promise<any> {
        return this.integrationService.getPrograms(connection);
    }
    
}