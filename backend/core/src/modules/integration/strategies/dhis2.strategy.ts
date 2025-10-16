import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { isAxiosError } from 'axios';
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

interface Dhis2ErrorResponse {
  httpStatus?: string;
  httpStatusCode?: number;
  status?: string;
  message?: string;
  error?: string;
  // DHIS2 often includes validation details:
  response?: unknown;
  importSummaries?: unknown;
  conflicts?: unknown[];
}

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
          headers: { Authorization: `ApiToken ${config.pat}` },
        }),
      );
      if (response.data) {
        return true;
      }
      return false;
    } catch (error: unknown) {
      if (isAxiosError<{ error: string }>(error)) {
        if (error.response?.status === 401) {
          this.logger.error('Connection failed: Unauthorized');
          throw new UnauthorizedException(error.response.data.error);
        }
      }
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
    { id, type }: { id: string; type: 'program' | 'dataset' },
  ): Promise<SchemaProgramResponse[] | SchemaDatasetResponse[]> {
    let url: string;

    try {
      if (type === 'program') {
        const fields =
          'id,name,programStages[id,programStageDataElements[dataElement[id,name]]]';
        const encodedFields = encodeURIComponent(fields);
        url = `programs/${id}.json?fields=${encodedFields}`;
      } else {
        const fields = 'id,name,dataSetElements[dataElement[id,name]]';
        const encodedFields = encodeURIComponent(fields);
        url = `dataSets/${id}.json?fields=${encodedFields}`;
      }

      url = `${config.baseUrl}/api/${url}`;

      const response = await firstValueFrom(
        this.httpService.get<SchemaProgramResponse[] | SchemaDatasetResponse[]>(
          url,
          {
            headers: {
              Authorization: `ApiToken ${config.pat}`,
            },
          },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<{ error: string }>(error)) {
        console.log('error: ', error?.response?.data);
        if (error.response?.status === 401) {
          this.logger.error('Connection failed: Unauthorized');
          throw new UnauthorizedException(error.response.data.error);
        }
      }
      if (error instanceof Error) {
        this.logger.error('Connection failed: ' + error.message);
        throw new Error('Connection failed: ' + error.message);
      }
      this.logger.error('Connection failed: ' + String(error));
      throw new Error('Connection failed: ' + String(error));
    }
  }

  // TODO: Handle case for multiple orgUnits
  async pushData(
    config: Dhis2ConnectionConfig,
    payload: EventPayload | DatasetPayload,
  ): Promise<Dhis2ImportSummary> {
    try {
      let url: string;

      if ('program' in payload) {
        url = `${config.baseUrl}/api/events`;
      } else if ('dataSet' in payload) {
        url = `${config.baseUrl}/api/dataValueSets`;
      } else {
        throw new Error(
          'Unknown DHIS2 payload type: expected program or dataSet',
        );
      }

      const response = await firstValueFrom(
        this.httpService.post<Dhis2ImportSummary>(url, payload, {
          headers: {
            Authorization: `ApiToken ${config.pat}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error = error.response?.data;

        this.logger.error(
          `Failed to push data to DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error || 'Unknown error from DHIS2 API',
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async getPrograms(
    config: Dhis2ConnectionConfig,
  ): Promise<FetchProgramsResponse> {
    try {
      const url = `${config.baseUrl}/api/programs`;
      const response = await firstValueFrom(
        this.httpService.get<FetchProgramsResponse>(url, {
          headers: { Authorization: `ApiToken ${config.pat}` },
        }),
      );

      console.log('res', response);

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error = error.response?.data;

        this.logger.error(
          `Failed to fetch programs from DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error || 'Unknown error from DHIS2 API',
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async getDatasets(
    config: Dhis2ConnectionConfig,
  ): Promise<FetchDatasetsResponse> {
    try {
      const url = `${config.baseUrl}/api/dataSets`;

      const response = await firstValueFrom(
        this.httpService.get<FetchDatasetsResponse>(url, {
          headers: { Authorization: `ApiToken ${config.pat}` },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error: Dhis2ErrorResponse | undefined = error.response?.data;

        this.logger.error(
          `Failed to fetch datasets from DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error ?? { message: 'Unknown error from DHIS2 API' },
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async getOrgUnits(
    config: Dhis2ConnectionConfig,
    { id, type }: { id: string; type: 'program' | 'dataset' },
  ): Promise<OrgUnit[]> {
    let url: string;

    try {
      if (type === 'program') {
        url = `programs/${id}.json?fields=organisationUnits`;
      } else {
        url = `dataSets/${id}.json?fields=organisationUnits[id,displayName]]`;
      }

      url = `${config.baseUrl}/api/${url}`;

      const response = await firstValueFrom(
        this.httpService.get<OrgUnit[]>(url, {
          headers: { Authorization: `ApiToken ${config.pat}` },
        }),
      );
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error = error.response?.data;

        this.logger.error(
          `Failed to fetch programs from DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error || 'Unknown error from DHIS2 API',
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }
}
