import type { Dhis2ConnectionConfig } from '@/common/interfaces';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import type {
  DatasetPayload,
  Dhis2ImportSummary,
  Dhis2SystemInfo,
  EventPayload,
  FetchDatasetsResponse,
  FetchProgramsResponse,
  OrgUnit,
  Pagination,
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
    if (!config.baseUrl || !config.pat) {
      throw new BadRequestException('Both baseUrl and PAT must be provided.');
    }

    const url = `${config.baseUrl}/api/system/info`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<Dhis2SystemInfo>(url, {
          headers: { Authorization: `ApiToken ${config.pat}` },
          timeout: 10000,
        }),
      );

      if (response.data?.version && response.data?.contextPath) {
        return {
          success: true,
          message: `Connected successfully to DHIS2 (${response.data.version})`,
          instanceName: response.data.systemName || 'Unknown DHIS2 Instance',
        };
      }

      throw new BadRequestException(
        'Connected to server, but it does not appear to be a valid DHIS2 instance.',
      );
    } catch (error: unknown) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      if (isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
          throw new BadRequestException(
            `Cannot reach DHIS2 at "${config.baseUrl}". Please check the URL.`,
          );
        }

        if (error.code === 'ECONNREFUSED') {
          throw new ServiceUnavailableException(
            `Connection refused — DHIS2 server at "${config.baseUrl}" is unreachable.`,
          );
        }

        if (error.code === 'ETIMEDOUT') {
          throw new RequestTimeoutException(
            `Timed out while trying to reach DHIS2 at "${config.baseUrl}".`,
          );
        }

        if (error.response) {
          const status = error.response.status;
          const message = ((error.response.data &&
            JSON.stringify(error.response.data)) ||
            'Unknown error from DHIS2 API') as string;

          if (status === 401) {
            throw new UnauthorizedException('Invalid API token for DHIS2.');
          }

          if (status === 403) {
            throw new ForbiddenException(
              'You do not have permission to access DHIS2.',
            );
          }

          if (status === 404) {
            throw new NotFoundException(
              `Endpoint not found — please verify the DHIS2 URL (${config.baseUrl}).`,
            );
          }

          throw new HttpException(message, status);
        }
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async fetchSchemas(
    config: Dhis2ConnectionConfig,
    { id, type }: { id: string; type: 'program' | 'dataset' },
  ): Promise<SchemaProgramResponse[] | SchemaDatasetResponse[]> {
    let url: string;

    if (type === 'program') {
      const fields =
        'id,name,programStages[id,displayName,programStageDataElements[dataElement[id,name,valueType,displayName]]]';
      const encodedFields = encodeURIComponent(fields);
      url = `programs/${id}.json?fields=${encodedFields}`;
    } else {
      const fields =
        'id,name,dataSetElements[dataElement[id,name,valueType,displayName]]';
      const encodedFields = encodeURIComponent(fields);
      url = `dataSets/${id}.json?fields=${encodedFields}`;
    }

    url = `${config.baseUrl}/api/${url}`;

    try {
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
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error = error.response?.data;

        this.logger.error(
          `Failed to fetch schemas from DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error
            ? { message: dhis2Error }
            : { message: 'Unknown error from DHIS2 API' },
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async pushData(
    config: Dhis2ConnectionConfig,
    payload: EventPayload[] | DatasetPayload,
  ): Promise<Dhis2ImportSummary> {
    let url: string;
    let requestPayload: unknown;

    if (Array.isArray(payload)) {
      url = `${config.baseUrl}/api/tracker?async=false`;
      requestPayload = {
        events: payload.map(event => this.transformToTrackerEvent(event)),
      };
    } else if ('dataSet' in payload) {
      url = `${config.baseUrl}/api/dataValueSets`;
      requestPayload = payload;
    } else {
      throw new BadRequestException(
        'Unknown DHIS2 payload type: expected EventPayload[] or DatasetPayload',
      );
    }

    this.logger.log(
      `Pushing data to DHIS2 at ${url} with payload: ${JSON.stringify(requestPayload)}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<Dhis2ImportSummary>(url, requestPayload, {
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
          dhis2Error
            ? { message: dhis2Error }
            : { message: 'Unknown error from DHIS2 API' },
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  private transformToTrackerEvent(
    event: EventPayload,
  ): Record<string, unknown> {
    return {
      orgUnit: event.orgUnit,
      program: event.program,
      programStage: event.programStage,
      occurredAt: event.eventDate,
      status: event.status || 'ACTIVE',
      dataValues: event.dataValues.map(dv => ({
        dataElement: dv.dataElement,
        value: this.normalizeValue(dv.value),
      })),
    };
  }

  private normalizeValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    return JSON.stringify(value);
  }

  async getPrograms(
    config: Dhis2ConnectionConfig,
    { page, pageSize }: Pagination,
  ): Promise<FetchProgramsResponse> {
    const url = `${config.baseUrl}/api/programs?page=${page}&pageSize=${pageSize}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get<FetchProgramsResponse>(url, {
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
          dhis2Error
            ? { message: dhis2Error }
            : { message: 'Unknown error from DHIS2 API' },
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  async getDatasets(
    config: Dhis2ConnectionConfig,
    { page, pageSize }: Pagination,
  ): Promise<FetchDatasetsResponse> {
    const url = `${config.baseUrl}/api/dataSets?page=${page}&pageSize=${pageSize}`;

    try {
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
          dhis2Error
            ? { message: dhis2Error }
            : { message: 'Unknown error from DHIS2 API' },
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
    const fieldsParam = encodeURIComponent(
      'displayName,id,organisationUnits[id,displayName,parent[id,displayName]]',
    );
    const url =
      type === 'program'
        ? `${config.baseUrl}/api/programs/${id}.json?fields=${fieldsParam}`
        : `${config.baseUrl}/api/dataSets/${id}.json?fields=${fieldsParam}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<{ organisationUnits: OrgUnit[] }>(url, {
          headers: { Authorization: `ApiToken ${config.pat}` },
        }),
      );

      return response.data.organisationUnits ?? [];
    } catch (error: unknown) {
      if (isAxiosError<Dhis2ErrorResponse>(error)) {
        const status = error.response?.status ?? 500;
        const dhis2Error = error.response?.data;

        this.logger.error(
          `Failed to fetch org units from DHIS2: ${JSON.stringify(dhis2Error)}`,
        );

        throw new HttpException(
          dhis2Error
            ? { message: dhis2Error }
            : { message: 'Unknown error from DHIS2 API' },
          status,
        );
      }

      this.logger.error('Unexpected error: ' + String(error));
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }
}
