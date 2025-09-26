import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { Dhis2ConnectionConfig } from 'src/common/interfaces';
import type {
  DatasetPayload,
  Dhis2ImportSummary,
  Dhis2SystemInfo,
  EventPayload,
  FetchDatasetsResponse,
  FetchProgramsResponse,
  OrgUnit,
  SchemaDatasetResponse,
  SchemaProgramResponse,
} from '../interfaces';
import { ConnectorStrategy } from '../interfaces';

@Injectable()
export class Dhis2Strategy extends ConnectorStrategy {
  private readonly logger = new Logger(Dhis2Strategy.name);

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async testConnection(config: Dhis2ConnectionConfig) {
    try {
      const url = `${config.baseUrl}/api/system/info`;
      const response = await firstValueFrom(
        this.httpService.get<Dhis2SystemInfo>(url, {
          headers: { Authorization: `Bearer ${config.pat}` },
        }),
      );
      if (response.data) {
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Connection failed: ' + error.message);
        throw new Error('Connection failed: ' + error.message);
      }
      this.logger.error('Connection failed: ' + String(error));
      throw new Error('Connection failed: ' + String(error));
    }
  }

  async fetchSchemas(
    config: Dhis2ConnectionConfig,
  ): Promise<SchemaProgramResponse[] | SchemaDatasetResponse[]> {
    try {
      const url = `${config.baseUrl}/schema`;
      const response = await firstValueFrom(
        this.httpService.get<SchemaProgramResponse[] | SchemaDatasetResponse[]>(
          url,
          {
            auth: {
              username: config.username ?? '',
              password: config.password ?? '',
            },
          },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Failed to fetch schemas: ' + error.message);
        throw new Error('Failed to fetch schemas: ' + error.message);
      }
      this.logger.error('Failed to fetch schemas: ' + String(error));
      throw new Error('Failed to fetch schemas: ' + String(error));
    }
  }

  async pushData(
    config: Dhis2ConnectionConfig,
    payload: EventPayload | DatasetPayload,
  ): Promise<Dhis2ImportSummary> {
    try {
      const url = `${config.baseUrl}/api/dataValueSets`;

      const response = await firstValueFrom(
        this.httpService.post<Dhis2ImportSummary>(url, payload, {
          headers: { Authorization: `Bearer ${config.pat}` },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Failed to push data: ' + error.message);
        throw new InternalServerErrorException(
          'Failed to push data: ' + error.message,
        );
      }
      this.logger.error('Failed to push data: ' + String(error));
      throw new InternalServerErrorException(
        'Failed to push data: ' + String(error),
      );
    }
  }

  async getPrograms(
    config: Dhis2ConnectionConfig,
  ): Promise<FetchProgramsResponse> {
    try {
      const url = `${config.baseUrl}/api/programs`;
      const response = await firstValueFrom(
        this.httpService.get<FetchProgramsResponse>(url, {
          headers: { Authorization: `Bearer ${config.pat}` },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Failed to fetch programs: ' + error.message);
        throw new Error('Failed to fetch programs: ' + error.message);
      }
      this.logger.error('Failed to fetch programs: ' + String(error));
      throw new Error('Failed to fetch programs: ' + String(error));
    }
  }

  async getDatasets(
    config: Dhis2ConnectionConfig,
  ): Promise<FetchDatasetsResponse> {
    try {
      const url = `${config.baseUrl}/api/dataSets`;
      const response = await firstValueFrom(
        this.httpService.get<FetchDatasetsResponse>(url, {
          headers: { Authorization: `Bearer ${config.pat}` },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error('Failed to fetch data sets: ' + error.message);
      }
      throw new Error('Failed to fetch data sets: ' + String(error));
    }
  }

  async getOrgUnits(config: Dhis2ConnectionConfig): Promise<OrgUnit[]> {
    try {
      const url = `${config.baseUrl}/api/organisationUnits`;
      const response = await firstValueFrom(
        this.httpService.get<OrgUnit[]>(url, {
          headers: { Authorization: `Bearer ${config.pat}` },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          'Failed to fetch organization units: ' + error.message,
        );
        throw new Error('Failed to fetch organization units: ' + error.message);
      }
      this.logger.error('Failed to fetch organization units: ' + String(error));
      throw new Error('Failed to fetch organization units: ' + String(error));
    }
  }
}
