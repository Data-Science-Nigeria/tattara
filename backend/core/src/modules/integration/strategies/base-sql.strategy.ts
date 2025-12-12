import { Knex } from 'knex';
import type { SqlConnectionConfig } from '@/common/interfaces';
import type { ColumnValue } from '../interfaces';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import { FieldType, SqlDatabaseType } from '@/common/enums';

/**
 * Database-specific error codes for common constraint violations
 */
export const ERROR_CODES = {
  // Unique constraint violation
  UNIQUE_VIOLATION: {
    pg: '23505',
    mysql: 'ER_DUP_ENTRY',
    mysql2: 'ER_DUP_ENTRY',
    sqlite3: 'SQLITE_CONSTRAINT_UNIQUE',
    mssql: '2627',
    oracledb: 'ORA-00001',
  },
  // Foreign key violation
  FOREIGN_KEY_VIOLATION: {
    pg: '23503',
    mysql: 'ER_NO_REFERENCED_ROW_2',
    mysql2: 'ER_NO_REFERENCED_ROW_2',
    sqlite3: 'SQLITE_CONSTRAINT_FOREIGNKEY',
    mssql: '547',
    oracledb: 'ORA-02291',
  },
  // Table not found
  TABLE_NOT_FOUND: {
    pg: '42P01',
    mysql: 'ER_NO_SUCH_TABLE',
    mysql2: 'ER_NO_SUCH_TABLE',
    sqlite3: 'SQLITE_ERROR',
    mssql: '208',
    oracledb: 'ORA-00942',
  },
} as const;

/**
 * Base abstract class for SQL database strategies
 * Provides common functionality for all SQL databases
 */
export abstract class BaseSqlStrategy extends ConnectorStrategy {
  protected abstract readonly logger: any;

  /**
   * Build Knex connection configuration
   */
  protected abstract buildKnexConfig(config: SqlConnectionConfig): Knex.Config;

  /**
   * Validate connection configuration
   */
  protected abstract validateConfig(config: SqlConnectionConfig): void;

  /**
   * Create schema if it doesn't exist
   */
  protected abstract ensureSchemaExists(
    db: Knex,
    schema: string,
  ): Promise<void>;

  /**
   * Check if table exists
   */
  protected abstract hasTable(
    db: Knex,
    schema: string,
    table: string,
  ): Promise<boolean>;

  /**
   * Create table with columns inferred from first row
   */
  protected abstract createTable(
    db: Knex,
    schema: string,
    table: string,
    firstRow: ColumnValue[],
  ): Promise<void>;

  /**
   * Insert data and return results
   */
  protected abstract insertData(
    db: Knex,
    schema: string,
    table: string,
    data: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]>;

  /**
   * Normalize client type (mysql -> mysql2, etc.)
   */
  protected normalizeClient(client: SqlDatabaseType): SqlDatabaseType {
    return client === SqlDatabaseType.MYSQL ? SqlDatabaseType.MYSQL2 : client;
  }

  /**
   * Add column based on field type
   */
  protected addColumnByType(
    t: Knex.CreateTableBuilder,
    col: ColumnValue,
  ): void {
    switch (col.type) {
      case FieldType.NUMBER:
        t.float(col.column);
        break;
      case FieldType.BOOLEAN:
        t.boolean(col.column);
        break;
      case FieldType.DATE:
      case FieldType.DATETIME:
        t.timestamp(col.column);
        break;
      case FieldType.TEXT:
      case FieldType.SELECT:
      case FieldType.MULTISELECT:
      case FieldType.EMAIL:
      case FieldType.PHONE:
      case FieldType.URL:
      case FieldType.TEXTAREA:
      default:
        t.text(col.column);
        break;
    }
  }

  /**
   * Database error interface for type safety
   */
  protected isDatabaseError(err: unknown): err is {
    code?: string;
    errno?: string;
    number?: string;
    message?: string;
    stack?: string;
  } {
    return typeof err === 'object' && err !== null;
  }

  /**
   * Check if error code matches for the specific database client
   */
  protected isErrorCode(
    errorCode: string,
    errorCodes: Record<string, string>,
  ): boolean {
    return Object.values(errorCodes).includes(errorCode);
  }
}
