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

  async fetchSchemas(
    connId: string,
    options?: {
      id?: string;
      type?: 'program' | 'dataset';
    },
  ): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    return this.getStrategy(conn.type).fetchSchemas(
      conn.configuration,
      options,
    );
  }

  async pushData(config: WorkflowConfiguration, payload: unknown) {
    const conn = await this.externalConnService.findOne(
      config.externalConnection.id,
    );

    return this.getStrategy(config.type).pushData(conn.configuration, payload);
  }

  async getPrograms(connId: string): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    if (conn.type !== IntegrationType.DHIS2) {
      throw new Error('getPrograms is only supported for DHIS2 connectors');
    }

    return this.dhis2.getPrograms(conn.configuration as Dhis2ConnectionConfig);
  }

  async getDatasets(connId: string): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    if (conn.type !== IntegrationType.DHIS2) {
      throw new Error('getDatasets is only supported for DHIS2 connectors');
    }

    return this.dhis2.getDatasets(conn.configuration as Dhis2ConnectionConfig);
  }

  async getOrgUnits(
    connId: string,
    options: { id: string; type: 'program' | 'dataset' },
  ): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    if (conn.type !== IntegrationType.DHIS2) {
      throw new Error('getOrgUnits is only supported for DHIS2 connectors');
    }

    return this.dhis2.getOrgUnits(
      conn.configuration as Dhis2ConnectionConfig,
      options,
    );
  }
}
