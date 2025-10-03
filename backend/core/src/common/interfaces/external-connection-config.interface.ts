export interface PostgresConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface Dhis2ConnectionConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  pat?: string;
  apiVersion?: string;
  ssl?: boolean;
  timeout?: number;
}

export type ExternalConnectionConfiguration =
  | PostgresConnectionConfig
  | Dhis2ConnectionConfig;
