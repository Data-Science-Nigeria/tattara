import { Injectable } from '@nestjs/common';
import { IntegrationType } from 'src/common/enums';
import type {
  Dhis2ConnectionConfig,
  ExternalConnectionConfiguration,
} from 'src/common/interfaces';
import { WorkflowConfiguration } from 'src/database/entities';
import { ExternalConnectionService } from '.';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import { Dhis2Strategy } from '../strategies/dhis2.strategy';
import { PostgresStrategy } from '../strategies/postgres.strategy';

@Injectable()
export class IntegrationService {
  private readonly strategies: Record<string, ConnectorStrategy>;

  constructor(
    private readonly postgres: PostgresStrategy,
    private readonly dhis2: Dhis2Strategy,
    private readonly externalConnService: ExternalConnectionService,
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

  async testConnection(connection: {
    type: string;
    config: ExternalConnectionConfiguration;
  }): Promise<any> {
    return this.getStrategy(connection.type).testConnection(connection.config);
  }

  async fetchSchemas(connId: string): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    return this.getStrategy(conn.type).fetchSchemas(conn.configuration);
  }

  async pushData(config: WorkflowConfiguration, payload: unknown) {
    const conn = await this.externalConnService.findOne(
      config.externalConnection.id,
    );

    return this.getStrategy(config.type).pushData(conn.configuration, payload);
  }

  async getPrograms(connection: {
    type: IntegrationType;
    config: Dhis2ConnectionConfig;
  }): Promise<any> {
    if (connection.type !== IntegrationType.DHIS2) {
      throw new Error('getPrograms is only supported for DHIS2 connectors');
    }
    return this.dhis2.getPrograms(connection.config);
  }
}
