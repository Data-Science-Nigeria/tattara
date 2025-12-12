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
 * MySQL Database Strategy
 * Supports MySQL and MySQL2 (MariaDB)
 */
@Injectable()
export class MysqlStrategy extends BaseSqlStrategy {
  protected readonly logger = new Logger(MysqlStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  protected buildKnexConfig(config: SqlConnectionConfig): Knex.Config {
    const { host, port, username, password, database, ssl } = config;

    return {
      client: 'mysql2',
      connection: {
        host,
        port,
        user: username,
        password,
        database,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
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
      await db.raw('SELECT 1');
      this.logger.log('Connection to MySQL database successful');
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

    const cacheKey = `schemas:mysql:${config.host}:${config.port}:${config.database}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      this.logger.log('Fetching MySQL schemas...');

      type TableRow = { TABLE_NAME: string };
      type ColumnRow = {
        COLUMN_NAME: string;
        DATA_TYPE: string;
        IS_NULLABLE: string;
      };

      const tableRows: TableRow[] = await db
        .select<TableRow[]>('TABLE_NAME')
        .from('information_schema.TABLES')
        .where('TABLE_SCHEMA', config.database)
        .where('TABLE_TYPE', 'BASE TABLE');

      const tables: TableMetadata[] = await Promise.all(
        tableRows.map(async ({ TABLE_NAME }) => {
          const columnRows: ColumnRow[] = await db
            .select<ColumnRow[]>('COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE')
            .from('information_schema.COLUMNS')
            .where({ TABLE_SCHEMA: config.database, TABLE_NAME });

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
      const schemas: SchemaMetadata[] = [{ name: config.database, tables }];

      this.logger.log(`Fetched ${schemas.length} schema successfully`);
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
      // MySQL: schema parameter is the database (already connected to in buildKnexConfig)
      const hasTable = await db.schema.hasTable(table);

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
    // MySQL uses database as schema - database must exist before operations
    // No action needed as the database should already be specified in connection config
  }

  protected async hasTable(
    db: Knex,
    _schema: string,
    table: string,
  ): Promise<boolean> {
    // MySQL: schema parameter is the database (already connected to)
    return db.schema.hasTable(table);
  }

  protected async createTable(
    db: Knex,
    _schema: string,
    table: string,
    firstRow: ColumnValue[],
  ): Promise<void> {
    // MySQL: schema parameter is the database (already connected to)
    // Simply create table in the current database without schema prefix
    await db.schema.createTable(table, (t: Knex.CreateTableBuilder) => {
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
    const result = await db(table).insert(data);
    const insertId = result[0];
    return data.map((row, idx) => ({ ...row, id: insertId + idx }));
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
      errorCode = err.errno ?? err.code ?? '';
      errorMessage = err.message ?? 'Unknown database error';
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    this.logger.error(
      `DB error inserting into ${schema}.${table}: ${errorCode} - ${errorMessage}`,
      errorStack,
    );

    if (
      errorCode === ERROR_CODES.UNIQUE_VIOLATION.mysql2 ||
      errorCode === ERROR_CODES.UNIQUE_VIOLATION.mysql
    ) {
      throw new ConflictException(
        'Duplicate key value violates unique constraint',
      );
    }

    if (
      errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION.mysql2 ||
      errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION.mysql
    ) {
      throw new BadRequestException('Invalid foreign key reference');
    }

    if (
      errorCode === ERROR_CODES.TABLE_NOT_FOUND.mysql2 ||
      errorCode === ERROR_CODES.TABLE_NOT_FOUND.mysql
    ) {
      throw new BadRequestException(
        `Table "${schema}.${table}" does not exist`,
      );
    }

    throw new InternalServerErrorException(errorMessage);
  }
}
