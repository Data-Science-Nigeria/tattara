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
 * Oracle Database Strategy
 */
@Injectable()
export class OracleStrategy extends BaseSqlStrategy {
  protected readonly logger = new Logger(OracleStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  protected buildKnexConfig(config: SqlConnectionConfig): Knex.Config {
    const { host, port, username, password, database, connectionTimeout } =
      config;

    return {
      client: 'oracledb',
      connection: {
        host,
        port,
        user: username,
        password,
        database,
        requestTimeout: connectionTimeout || 10000,
      },
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
      await db.raw('SELECT 1 FROM DUAL');
      this.logger.log('Connection to Oracle database successful');
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

    const cacheKey = `schemas:oracledb:${config.host}:${config.port}:${config.database}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      this.logger.log('Fetching Oracle schemas...');

      type SchemaRow = { owner: string };
      type TableRow = { table_name: string };
      type ColumnRow = {
        column_name: string;
        data_type: string;
        nullable: string;
      };

      const schemaResult = await db.raw<{ rows: SchemaRow[] }>(
        `SELECT DISTINCT owner FROM dba_tables 
         WHERE owner NOT IN ('SYS', 'SYSTEM', 'XDB', 'APEX_030200')`,
      );
      const schemaRows: SchemaRow[] = Array.isArray(schemaResult)
        ? schemaResult
        : (schemaResult.rows ?? []);

      const schemas: SchemaMetadata[] = await Promise.all(
        schemaRows.map(async ({ owner }) => {
          const tableRows: TableRow[] = await db
            .select<TableRow[]>('table_name')
            .from('dba_tables')
            .where('owner', owner);

          const tables: TableMetadata[] = await Promise.all(
            tableRows.map(async ({ table_name }) => {
              const columnRows: ColumnRow[] = await db
                .select<ColumnRow[]>('column_name', 'data_type', 'nullable')
                .from('dba_tab_columns')
                .where({ owner, table_name });

              return {
                name: table_name,
                columns: columnRows.map(col => ({
                  name: col.column_name,
                  type: col.data_type,
                  nullable: col.nullable === 'Y',
                })),
              };
            }),
          );

          return { name: owner, tables };
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

  protected async ensureSchemaExists(): Promise<void> {
    // Oracle schemas are typically created separately
  }

  protected async hasTable(
    db: Knex,
    schema: string,
    table: string,
  ): Promise<boolean> {
    // Oracle-specific check
    const result = await db.raw<{ rows: Array<{ cnt: number }> }>(
      `SELECT COUNT(*) as cnt FROM dba_tables WHERE owner = :owner AND table_name = :table`,
      { owner: schema.toUpperCase(), table: table.toUpperCase() },
    );

    return (
      result &&
      Array.isArray(result.rows) &&
      result.rows[0] &&
      result.rows[0].cnt > 0
    );
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
      errorCode = err.code ?? '';
      errorMessage = err.message ?? 'Unknown database error';
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    this.logger.error(
      `DB error inserting into ${schema}.${table}: ${errorCode} - ${errorMessage}`,
      errorStack,
    );

    if (errorCode === ERROR_CODES.UNIQUE_VIOLATION.oracledb) {
      throw new ConflictException(
        'Duplicate key value violates unique constraint',
      );
    }

    if (errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION.oracledb) {
      throw new BadRequestException('Invalid foreign key reference');
    }

    if (errorCode === ERROR_CODES.TABLE_NOT_FOUND.oracledb) {
      throw new BadRequestException(
        `Table "${schema}.${table}" does not exist`,
      );
    }

    throw new InternalServerErrorException(errorMessage);
  }
}
