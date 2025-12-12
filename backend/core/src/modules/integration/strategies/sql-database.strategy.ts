import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import knex, { Knex } from 'knex';
import type { SqlConnectionConfig } from '@/common/interfaces';
import type {
  ColumnValue,
  PushPayload,
  SchemaMetadata,
  TableMetadata,
} from '../interfaces';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import { FieldType, SqlDatabaseType } from '@/common/enums';

/**
 * Database-specific error codes for common constraint violations
 */
const ERROR_CODES = {
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
 * Generic SQL Database Strategy
 * Supports PostgreSQL, MySQL, SQLite, MSSQL, and Oracle databases using Knex.js
 */
@Injectable()
export class SqlDatabaseStrategy extends ConnectorStrategy {
  private readonly logger = new Logger(SqlDatabaseStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  /**
   * Normalize client type (mysql -> mysql2, etc.)
   */
  private normalizeClient(client: SqlDatabaseType): SqlDatabaseType {
    return client === SqlDatabaseType.MYSQL ? SqlDatabaseType.MYSQL2 : client;
  }

  /**
   * Build Knex connection configuration based on database type
   */
  private buildKnexConfig(config: SqlConnectionConfig): Knex.Config {
    const { client, host, port, username, password, database, ssl, filename } =
      config;

    // SQLite uses filename instead of host/port
    if (client === SqlDatabaseType.SQLITE) {
      return {
        client: 'sqlite3',
        connection: {
          filename: filename || database,
        },
        useNullAsDefault: true,
      };
    }

    // Normalize MySQL client (mysql -> mysql2)
    const normalizedClient = this.normalizeClient(client);

    // Standard client/server databases
    return {
      client: normalizedClient,
      connection: {
        host,
        port,
        user: username,
        password,
        database,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: config.connectionTimeout || 10000,
      },
    };
  }

  /**
   * Validate connection configuration based on database type
   */
  private validateConfig(config: SqlConnectionConfig): void {
    const { client, host, port, username, database, filename } = config;

    if (!client) {
      throw new BadRequestException(
        'Invalid connection configuration: client (database type) is required',
      );
    }

    // SQLite only needs filename/database
    if (client === SqlDatabaseType.SQLITE) {
      if (!filename && !database) {
        throw new BadRequestException(
          'Invalid connection configuration: filename or database is required for SQLite',
        );
      }
      return;
    }

    // Other databases need host, port, username, database
    const missingFields: string[] = [];
    if (!host) missingFields.push('host');
    if (!port) missingFields.push('port');
    if (!username) missingFields.push('username');
    if (!database) missingFields.push('database');

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Invalid connection configuration: ${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
      );
    }
  }

  /**
   * Test database connection
   */
  async testConnection(config: SqlConnectionConfig): Promise<boolean> {
    this.validateConfig(config);

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      // Use a simple query that works across all databases
      await db.raw('SELECT 1');

      this.logger.log(`Connection to ${config.client} database successful`);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Connection failed: ${err.message}`, err.stack);
        throw new BadRequestException(`Connection failed: ${err.message}`);
      }
      this.logger.error(`Connection failed: ${String(err)}`);
      throw new BadRequestException(`Connection failed: ${String(err)}`);
    } finally {
      await db.destroy();
    }
  }

  /**
   * Fetch database schemas, tables, and columns metadata
   */
  async fetchSchemas(config: SqlConnectionConfig): Promise<SchemaMetadata[]> {
    this.validateConfig(config);

    const cacheKey = `schemas:${config.client}:${config.host || 'local'}:${config.port || 'file'}:${config.database}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      this.logger.log(`Fetching schemas for ${config.client} database...`);

      let schemas: SchemaMetadata[];
      const normalizedClient = this.normalizeClient(config.client);

      switch (normalizedClient) {
        case SqlDatabaseType.POSTGRESSQL:
          schemas = await this.fetchPostgresSchemas(db);
          break;
        case SqlDatabaseType.MYSQL2:
          schemas = await this.fetchMysqlSchemas(db, config.database);
          break;
        case SqlDatabaseType.SQLITE:
          schemas = await this.fetchSqliteSchemas(db);
          break;
        case SqlDatabaseType.MSSQL:
          schemas = await this.fetchMssqlSchemas(db);
          break;
        default:
          // Fallback to PostgreSQL-style for other databases
          schemas = await this.fetchPostgresSchemas(db);
      }

      this.logger.log(`Fetched ${schemas.length} schemas successfully`);
      await this.cache.set(cacheKey, schemas, 300_000);

      return schemas;
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `Error fetching schema metadata: ${err.message}`,
          err.stack,
        );
      } else {
        this.logger.error(
          `Unknown error fetching schema metadata: ${String(err)}`,
        );
      }
      throw new InternalServerErrorException('Failed to fetch schema metadata');
    } finally {
      await db.destroy();
    }
  }

  /**
   * Fetch PostgreSQL schemas
   */
  private async fetchPostgresSchemas(db: Knex): Promise<SchemaMetadata[]> {
    type SchemaRow = { schema_name: string };
    type TableRow = { table_name: string };
    type ColumnRow = {
      column_name: string;
      data_type: string;
      is_nullable: string;
    };

    const schemaRows: SchemaRow[] = await db
      .select<SchemaRow[]>('schema_name')
      .from('information_schema.schemata')
      .whereNotIn('schema_name', ['pg_catalog', 'information_schema']);

    return Promise.all(
      schemaRows.map(async ({ schema_name }) => {
        const tableRows: TableRow[] = await db
          .select<TableRow[]>('table_name')
          .from('information_schema.tables')
          .where('table_schema', schema_name);

        const tables: TableMetadata[] = await Promise.all(
          tableRows.map(async ({ table_name }) => {
            const columnRows: ColumnRow[] = await db
              .select<ColumnRow[]>('column_name', 'data_type', 'is_nullable')
              .from('information_schema.columns')
              .where({ table_schema: schema_name, table_name });

            return {
              name: table_name,
              columns: columnRows.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
              })),
            };
          }),
        );

        return { name: schema_name, tables };
      }),
    );
  }

  /**
   * Fetch MySQL schemas (databases)
   */
  private async fetchMysqlSchemas(
    db: Knex,
    database: string,
  ): Promise<SchemaMetadata[]> {
    type TableRow = { TABLE_NAME: string };
    type ColumnRow = {
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
    };

    const tableRows: TableRow[] = await db
      .select<TableRow[]>('TABLE_NAME')
      .from('information_schema.TABLES')
      .where('TABLE_SCHEMA', database)
      .where('TABLE_TYPE', 'BASE TABLE');

    const tables: TableMetadata[] = await Promise.all(
      tableRows.map(async ({ TABLE_NAME }) => {
        const columnRows: ColumnRow[] = await db
          .select<ColumnRow[]>('COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE')
          .from('information_schema.COLUMNS')
          .where({ TABLE_SCHEMA: database, TABLE_NAME });

        return {
          name: TABLE_NAME,
          columns: columnRows.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
          })),
        };
      }),
    );

    // MySQL treats each database as a schema
    return [{ name: database, tables }];
  }

  /**
   * Fetch SQLite schemas (SQLite has only one schema: 'main')
   */
  private async fetchSqliteSchemas(db: Knex): Promise<SchemaMetadata[]> {
    type TableRow = { name: string };
    type SqliteColumnRow = {
      name: string;
      type: string;
      notnull: number;
    };

    const tableRows: TableRow[] = await db
      .select<TableRow[]>('name')
      .from('sqlite_master')
      .where('type', 'table')
      .whereNot('name', 'like', 'sqlite_%');

    const tables: TableMetadata[] = await Promise.all(
      tableRows.map(async ({ name: tableName }) => {
        const result = await db.raw<{ rows?: SqliteColumnRow[] }>(
          `PRAGMA table_info("${tableName}")`,
        );
        // Knex returns different structures depending on the client
        const columnRows: SqliteColumnRow[] = Array.isArray(result)
          ? result
          : (result.rows ?? []);

        return {
          name: tableName,
          columns: columnRows.map((col: SqliteColumnRow) => ({
            name: col.name,
            type: col.type,
            nullable: col.notnull === 0,
          })),
        };
      }),
    );

    return [{ name: 'main', tables }];
  }

  /**
   * Fetch MSSQL schemas
   */
  private async fetchMssqlSchemas(db: Knex): Promise<SchemaMetadata[]> {
    type SchemaRow = { schema_name: string };
    type TableRow = { table_name: string };
    type ColumnRow = {
      column_name: string;
      data_type: string;
      is_nullable: string;
    };

    const schemaResult = await db.raw<{ rows: SchemaRow[] }>(
      `SELECT name as schema_name FROM sys.schemas 
       WHERE name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest')`,
    );
    const schemaRows: SchemaRow[] = Array.isArray(schemaResult)
      ? schemaResult
      : (schemaResult.rows ?? []);

    return Promise.all(
      schemaRows.map(async ({ schema_name }) => {
        const tableRows: TableRow[] = await db
          .select<TableRow[]>('table_name')
          .from('information_schema.tables')
          .where('table_schema', schema_name)
          .where('table_type', 'BASE TABLE');

        const tables: TableMetadata[] = await Promise.all(
          tableRows.map(async ({ table_name }) => {
            const columnRows: ColumnRow[] = await db
              .select<ColumnRow[]>('column_name', 'data_type', 'is_nullable')
              .from('information_schema.columns')
              .where({ table_schema: schema_name, table_name });

            return {
              name: table_name,
              columns: columnRows.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
              })),
            };
          }),
        );

        return { name: schema_name, tables };
      }),
    );
  }

  /**
   * Push data to a table (creates schema/table if not exists)
   */
  async pushData<R = Record<string, any>>(
    config: SqlConnectionConfig,
    payload: PushPayload,
  ): Promise<R[]> {
    this.validateConfig(config);

    const db = knex(this.buildKnexConfig(config));
    const { schema, table, rows } = payload;

    if (rows.length === 0) {
      throw new BadRequestException(
        'No data provided: either values or rows must be specified',
      );
    }

    // Build array of objects for insert
    const insertData = rows.map((row: ColumnValue[]) =>
      row.reduce<Record<string, unknown>>(
        (acc, v: ColumnValue) => ({ ...acc, [v.column]: v.value }),
        {},
      ),
    );

    // Use first row for schema inference
    const firstRow: ColumnValue[] = rows[0];
    const normalizedClient = this.normalizeClient(config.client);

    try {
      // Create schema if supported (not SQLite)
      if (normalizedClient !== SqlDatabaseType.SQLITE) {
        await this.ensureSchemaExists(db, schema, normalizedClient);
      }

      // Ensure table exists
      const hasTable = await this.hasTable(db, schema, table, normalizedClient);

      if (!hasTable) {
        await this.createTable(db, schema, table, firstRow, normalizedClient);
      }

      // Insert data
      const result = await this.insertData(
        db,
        schema,
        table,
        insertData,
        normalizedClient,
      );

      return result as R[];
    } catch (err: any) {
      this.handleDatabaseError(err, normalizedClient, schema, table);
    } finally {
      await db.destroy();
    }
  }

  /**
   * Ensure schema exists (database-specific)
   */
  private async ensureSchemaExists(
    db: Knex,
    schema: string,
    client: SqlDatabaseType,
  ): Promise<void> {
    switch (client) {
      case SqlDatabaseType.POSTGRESSQL:
        await db.raw(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        break;
      case SqlDatabaseType.MYSQL:
      case SqlDatabaseType.MYSQL2:
        await db.raw(`CREATE DATABASE IF NOT EXISTS \`${schema}\``);
        break;
      case SqlDatabaseType.MSSQL:
        await db.raw(`
          IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schema}')
          BEGIN
            EXEC('CREATE SCHEMA [${schema}]')
          END
        `);
        break;
      // SQLite doesn't support schemas
      default:
        break;
    }
  }

  /**
   * Check if table exists (database-specific)
   */
  private async hasTable(
    db: Knex,
    schema: string,
    table: string,
    client: SqlDatabaseType,
  ): Promise<boolean> {
    if (client === SqlDatabaseType.SQLITE) {
      return db.schema.hasTable(table);
    }
    return db.schema.withSchema(schema).hasTable(table);
  }

  /**
   * Create table with columns inferred from first row
   */
  private async createTable(
    db: Knex,
    schema: string,
    table: string,
    firstRow: ColumnValue[],
    client: SqlDatabaseType,
  ): Promise<void> {
    const createTableFn = (t: Knex.CreateTableBuilder) => {
      // SQLite uses INTEGER PRIMARY KEY for auto-increment
      if (client === SqlDatabaseType.SQLITE) {
        t.increments('id').primary();
      } else {
        t.increments('id').primary();
      }

      for (const col of firstRow) {
        this.addColumnByType(t, col, client);
      }
    };

    if (client === SqlDatabaseType.SQLITE) {
      await db.schema.createTable(table, createTableFn);
    } else {
      await db.schema.withSchema(schema).createTable(table, createTableFn);
    }
  }

  /**
   * Add column based on field type
   */
  private addColumnByType(
    t: Knex.CreateTableBuilder,
    col: ColumnValue,
    client: SqlDatabaseType,
  ): void {
    switch (col.type) {
      case FieldType.NUMBER:
        t.float(col.column);
        break;
      case FieldType.BOOLEAN:
        // SQLite doesn't have native boolean, uses integer
        if (client === SqlDatabaseType.SQLITE) {
          t.integer(col.column);
        } else {
          t.boolean(col.column);
        }
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
   * Insert data and return results
   */
  private async insertData(
    db: Knex,
    schema: string,
    table: string,
    data: Record<string, unknown>[],
    client: SqlDatabaseType,
  ): Promise<Record<string, unknown>[]> {
    // SQLite and MySQL don't support RETURNING clause natively
    if (client === SqlDatabaseType.SQLITE) {
      await db.table(table).insert(data);
      // For SQLite, return the inserted data with generated IDs
      const lastIdResult = await db
        .table(table)
        .max('id as id')
        .first<{ id: number }>();
      const maxId = lastIdResult?.id ?? 0;
      const startId = maxId - data.length + 1;
      return data.map((row, idx) => ({ ...row, id: startId + idx }));
    }

    if (client === SqlDatabaseType.MYSQL2) {
      const result = await db(table).insert(data);
      const insertId = result[0];
      return data.map((row, idx) => ({ ...row, id: insertId + idx }));
    }

    // PostgreSQL and MSSQL support RETURNING
    return db.withSchema(schema).table(table).insert(data).returning('*');
  }

  /**
   * Database error interface for type safety
   */
  private isDatabaseError(err: unknown): err is {
    code?: string;
    errno?: string;
    number?: string;
    message?: string;
    stack?: string;
  } {
    return typeof err === 'object' && err !== null;
  }

  /**
   * Handle database errors with database-specific error codes
   */
  private handleDatabaseError(
    err: unknown,
    client: SqlDatabaseType,
    schema: string,
    table: string,
  ): never {
    let errorCode = '';
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;

    if (this.isDatabaseError(err)) {
      errorCode = err.code ?? err.errno ?? err.number ?? '';
      errorMessage = err.message ?? 'Unknown database error';
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    this.logger.error(
      `DB error inserting into ${schema}.${table}: ${errorCode} - ${errorMessage}`,
      errorStack,
    );

    // Check for unique constraint violation
    if (this.isErrorCode(errorCode, ERROR_CODES.UNIQUE_VIOLATION, client)) {
      throw new ConflictException(
        'Duplicate key value violates unique constraint',
      );
    }

    // Check for foreign key violation
    if (
      this.isErrorCode(errorCode, ERROR_CODES.FOREIGN_KEY_VIOLATION, client)
    ) {
      throw new BadRequestException('Invalid foreign key reference');
    }

    // Check for table not found
    if (this.isErrorCode(errorCode, ERROR_CODES.TABLE_NOT_FOUND, client)) {
      throw new BadRequestException(
        `Table "${schema}.${table}" does not exist`,
      );
    }

    throw new InternalServerErrorException(errorMessage);
  }

  /**
   * Check if error code matches for the specific database client
   */
  private isErrorCode(
    errorCode: string,
    errorCodes: Record<SqlDatabaseType, string>,
    client: SqlDatabaseType,
  ): boolean {
    return errorCode === errorCodes[client];
  }
}
