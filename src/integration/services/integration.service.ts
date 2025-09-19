import { Injectable } from '@nestjs/common';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import { PostgresStrategy } from '../strategies/postgres.strategy';
import { Dhis2Strategy } from '../strategies/dhis2.strategy';
import type { ConnectionConfig, Dhis2Config } from '../interfaces/connection-config.interface';

@Injectable()
export class IntegrationService {
    private readonly strategies: Record<string, ConnectorStrategy>;

    constructor(
        private readonly postgres: PostgresStrategy,
        private readonly dhis2: Dhis2Strategy,
    ) {
        this.strategies = {
            postgres: this.postgres,
            dhis2: this.dhis2,
        };
    }

    private getStrategy(type: string): ConnectorStrategy {
        const strategy = this.strategies[type];
        if (!strategy) {
            throw new Error(`Unsupported connector type: ${type}`);
        }
        return strategy;
    }

    async testConnection(connection: { type: string; config: ConnectionConfig }): Promise<any> {
        return this.getStrategy(connection.type).testConnection(connection.config);
    }

    async fetchSchemas(connection: { type: string; config: ConnectionConfig }): Promise<any> {
        return this.getStrategy(connection.type).fetchSchemas(connection.config);
    }

    async pushData(connection: { type: string; config: ConnectionConfig }, payload: any): Promise<any> {
        return this.getStrategy(connection.type).pushData(connection.config, payload);
    }

    async getPrograms(connection: { type: string; config: Dhis2Config }): Promise<any> {
        if (connection.type !== 'dhis2') {
            throw new Error('getPrograms is only supported for DHIS2 connectors');
        }
        return (this.dhis2 as Dhis2Strategy).getPrograms(connection.config);
    }
    
}
