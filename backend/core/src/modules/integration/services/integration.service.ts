import { IntegrationType } from '@/common/enums';
import type {
  Dhis2ConnectionConfig,
  ExternalConnectionConfiguration,
} from '@/common/interfaces';
import { WorkflowConfiguration } from '@/database/entities';
import { Injectable } from '@nestjs/common';
import { ExternalConnectionService } from '.';
import { Pagination } from '../interfaces';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import { Dhis2Strategy } from '../strategies/dhis2.strategy';
import { MssqlStrategy } from '../strategies/mssql.strategy';
import { MysqlStrategy } from '../strategies/mysql.strategy';
import { OracleStrategy } from '../strategies/oracle.strategy';
import { PostgresStrategy } from '../strategies/postgres.strategy';
import { SqliteStrategy } from '../strategies/sqlite.strategy';

@Injectable()
export class IntegrationService {
  private readonly strategies: Record<string, ConnectorStrategy>;

  constructor(
    private readonly postgres: PostgresStrategy,
    private readonly mysql: MysqlStrategy,
    private readonly sqlite: SqliteStrategy,
    private readonly mssql: MssqlStrategy,
    private readonly oracle: OracleStrategy,
    private readonly dhis2: Dhis2Strategy,
    private readonly externalConnService: ExternalConnectionService,
  ) {
    this.strategies = {
      postgres: this.postgres,
      mysql: this.mysql,
      mysql2: this.mysql,
      sqlite3: this.sqlite,
      mssql: this.mssql,
      oracledb: this.oracle,
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
    console.log('Pushing data with config:', config);
    console.log('Payload:', payload);
    const conn = await this.externalConnService.findOne(
      config.externalConnection.id,
    );

    return this.getStrategy(config.type).pushData(conn.configuration, payload);
  }

  async getPrograms(connId: string, pagination: Pagination): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    if (conn.type !== IntegrationType.DHIS2) {
      throw new Error('getPrograms is only supported for DHIS2 connectors');
    }

    return this.dhis2.getPrograms(
      conn.configuration as Dhis2ConnectionConfig,
      pagination,
    );
  }

  async getDatasets(connId: string, pagination: Pagination): Promise<any> {
    const conn = await this.externalConnService.findOne(connId);

    if (conn.type !== IntegrationType.DHIS2) {
      throw new Error('getDatasets is only supported for DHIS2 connectors');
    }

    return this.dhis2.getDatasets(
      conn.configuration as Dhis2ConnectionConfig,
      pagination,
    );
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
