import { SqlDatabaseType } from '../enums';

/**
 * Generic SQL database connection configuration
 * Works with PostgreSQL, MySQL, SQLite, MSSQL, Oracle, etc.
 */
export interface SqlConnectionConfig {
  /** Database client type */
  client: SqlDatabaseType;
  /** Database host (not required for SQLite) */
  host?: string;
  /** Database port (not required for SQLite) */
  port?: number;
  /** Database name or file path for SQLite */
  database: string;
  /** Username (not required for SQLite) */
  username?: string;
  /** Password (not required for SQLite) */
  password?: string;
  /** Enable SSL connection */
  ssl?: boolean;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** For SQLite: file path to the database */
  filename?: string;
}

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
  | SqlConnectionConfig
  | Dhis2ConnectionConfig;
