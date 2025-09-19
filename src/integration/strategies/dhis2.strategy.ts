import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConnectorStrategy, Dhis2Config } from "../interfaces";
import type { 
    SchemaProgramResponse, 
    SchemaDatasetResponse, 
    EventPayload, 
    DatasetPayload,
    OrgUnit,
    FetchProgramsResponse,
    FetchDatasetsResponse,
    TestConnectionResponse,
    PushDataResponse,
    Dhis2ImportSummary,
    Dhis2SystemInfo
} from "../interfaces"
import { AxiosResponse } from "axios";




@Injectable()
export class Dhis2Strategy extends ConnectorStrategy {
    private readonly logger = new Logger(Dhis2Strategy.name);
    constructor(
        private readonly httpService: HttpService
    ) {
        super();
    }
    async testConnection(config: Dhis2Config): Promise<TestConnectionResponse> {
        try {
            const url = `${config.baseUrl}/api/system/info`;
            const response: AxiosResponse<Dhis2SystemInfo> =  await this.httpService.axiosRef.get(url, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return { success: true, message: "Connection successful", data: response.data };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Connection failed: " + error.message);
                throw new Error("Connection failed: " + error.message);
            }
            this.logger.error("Connection failed: " + String(error));
            throw new Error("Connection failed: " + String(error));
        }

    }

    async fetchSchemas(config: Dhis2Config): Promise<SchemaProgramResponse[] | SchemaDatasetResponse[]> {
        try {
            const url = `${config.baseUrl}/schema`;
            const response: AxiosResponse<SchemaProgramResponse[] | SchemaDatasetResponse[]> =  await this.httpService.axiosRef.get(url, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to fetch schemas: " + error.message);
                throw new Error("Failed to fetch schemas: " + error.message);
            }
            this.logger.error("Failed to fetch schemas: " + String(error));
            throw new Error("Failed to fetch schemas: " + String(error));
        }
    }

    async pushData(config: Dhis2Config, payload: EventPayload | DatasetPayload): Promise<PushDataResponse> {
        try {
            const url = `${config.baseUrl}/api/dataValueSets`;
            const response: AxiosResponse<Dhis2ImportSummary> = await this.httpService.axiosRef.post(url, payload, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return { success: true, message: "Data pushed successfully", data: response.data };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to push data: " + error.message);
                throw new Error("Failed to push data: " + error.message);
            }
            this.logger.error("Failed to push data: " + String(error));
            throw new Error("Failed to push data: " + String(error));
        }

    }

    // DHIS2 specific methods
    async getPrograms(config: Dhis2Config): Promise<FetchProgramsResponse> {
        try {
            const url = `${config.baseUrl}/api/programs`;
            const response: AxiosResponse<FetchProgramsResponse> =  await this.httpService.axiosRef.get(url, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to fetch programs: " + error.message);
                throw new Error("Failed to fetch programs: " + error.message);
            }
            this.logger.error("Failed to fetch programs: " + String(error));
            throw new Error("Failed to fetch programs: " + String(error));
        }
    }

    async getDatasets(config: Dhis2Config): Promise<FetchDatasetsResponse> {
        try {
            const url = `${config.baseUrl}/api/dataSets`;
            const response: AxiosResponse<FetchDatasetsResponse> =  await this.httpService.axiosRef.get(url, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error("Failed to fetch data sets: " + error.message);
            }
            throw new Error("Failed to fetch data sets: " + String(error));
        }
    }

    async getOrgUnits(config: Dhis2Config): Promise<OrgUnit[]> {
        try {
            const url = `${config.baseUrl}/api/organisationUnits`;
            const response: AxiosResponse<OrgUnit[]> =  await this.httpService.axiosRef.get(url, {
                auth: {
                    username: config.username ?? '',
                    password: config.password ?? '',
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to fetch organization units: " + error.message);
                throw new Error("Failed to fetch organization units: " + error.message);
            }
            this.logger.error("Failed to fetch organization units: " + String(error));
            throw new Error("Failed to fetch organization units: " + String(error));
        }
    }
}