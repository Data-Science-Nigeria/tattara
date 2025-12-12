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
import { BaseSqlStrategy, ERROR_CODES } from './base-sql.strategy';

/**
 * Microsoft SQL Server (MSSQL) Database Strategy
 */
@Injectable()
export class MssqlStrategy extends BaseSqlStrategy {
  protected readonly logger = new Logger(MssqlStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  protected buildKnexConfig(config: SqlConnectionConfig): Knex.Config {
    const { host, port, username, password, database, connectionTimeout } =
      config;

    interface MssqlConnectionConfig {
      server: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
      trustServerCertificate: boolean;
      connectionTimeout: number;
    }

    const connectionConfig: MssqlConnectionConfig = {
      server: host!,
      port,
      user: username,
      password,
      database,
      trustServerCertificate: true,
      connectionTimeout: connectionTimeout || 10000,
    };

    return {
      client: 'mssql',
      connection: connectionConfig,
    };
  }

  protected validateConfig(config: SqlConnectionConfig): void {
    const { host, port, username, password, database } = config;

    const missingFields: string[] = [];
    if (!host) missingFields.push('host');
    if (!port) missingFields.push('port');
    if (!username) missingFields.push('username');
    if (!password) missingFields.push('password');
    if (!database) missingFields.push('database');

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Invalid connection configuration: ${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
      );
    }
  }

  async testConnection(config: SqlConnectionConfig): Promise<boolean> {
    this.validateConfig(config);

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      await db.raw('SELECT 1');
      this.logger.log('Connection to MSSQL database successful');
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

  async fetchSchemas(config: SqlConnectionConfig): Promise<SchemaMetadata[]> {
    this.validateConfig(config);

    const cacheKey = `schemas:mssql:${config.host}:${config.port}:${config.database}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      this.logger.log('Fetching MSSQL schemas...');

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

      const schemas: SchemaMetadata[] = await Promise.all(
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

  async pushData<R = Record<string, any>>(
    config: SqlConnectionConfig,
    payload: PushPayload,
  ): Promise<R[]> {
    this.validateConfig(config);

    const db = knex(this.buildKnexConfig(config));
    const { schema, table, rows } = payload;

    if (rows.length === 0) {
      throw new BadRequestException('No data provided: rows must be specified');
    }

    const insertData = rows.map((row: ColumnValue[]) =>
      row.reduce<Record<string, unknown>>(
        (acc, v: ColumnValue) => ({ ...acc, [v.column]: v.value }),
        {},
      ),
    );

    const firstRow: ColumnValue[] = rows[0];

    try {
      // Create schema if not exists
      await this.ensureSchemaExists(db, schema);

      // Check if table exists
      const hasTable = await this.hasTable(db, schema, table);

      if (!hasTable) {
        await this.createTable(db, schema, table, firstRow);
      }

      // Insert data
      const result = await this.insertData(db, schema, table, insertData);
      return result as R[];
    } catch (err: any) {
      this.handleDatabaseError(err, schema, table);
    } finally {
      await db.destroy();
    }
  }

  protected async ensureSchemaExists(db: Knex, schema: string): Promise<void> {
    await db.raw(`
      IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schema}')
      BEGIN
        EXEC('CREATE SCHEMA [${schema}]')
      END
    `);
  }

  protected async hasTable(
    db: Knex,
    schema: string,
    table: string,
  ): Promise<boolean> {
    return db.schema.withSchema(schema).hasTable(table);
  }

  protected async createTable(
    db: Knex,
    schema: string,
    table: string,
    firstRow: ColumnValue[],
  ): Promise<void> {
    await db.schema
      .withSchema(schema)
      .createTable(table, (t: Knex.CreateTableBuilder) => {
        t.increments('id').primary();
        for (const col of firstRow) {
          this.addColumnByType(t, col);
        }
      });
  }

  protected async insertData(
    db: Knex,
    schema: string,
    table: string,
    data: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
    return db.withSchema(schema).table(table).insert(data).returning('*');
  }

  private handleDatabaseError(
    err: unknown,
    schema: string,
    table: string,
  ): never {
    let errorCode = '';
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;

    if (this.isDatabaseError(err)) {
      errorCode = err.number ?? err.code ?? '';
      errorMessage = err.message ?? 'Unknown database error';
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    this.logger.error(
      `DB error inserting into ${schema}.${table}: ${errorCode} - ${errorMessage}`,
      errorStack,
    );

    if (errorCode === ERROR_CODES.UNIQUE_VIOLATION.mssql) {
      throw new ConflictException(
        'Duplicate key value violates unique constraint',
      );
    }

    if (errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION.mssql) {
      throw new BadRequestException('Invalid foreign key reference');
    }

    if (errorCode === ERROR_CODES.TABLE_NOT_FOUND.mssql) {
      throw new BadRequestException(
        `Table "${schema}.${table}" does not exist`,
      );
    }

    throw new InternalServerErrorException(errorMessage);
  }
}
