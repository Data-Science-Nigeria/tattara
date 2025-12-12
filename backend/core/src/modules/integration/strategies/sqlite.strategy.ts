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
import { FieldType } from '@/common/enums';

/**
 * SQLite Database Strategy
 */
@Injectable()
export class SqliteStrategy extends BaseSqlStrategy {
  protected readonly logger = new Logger(SqliteStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  protected buildKnexConfig(config: SqlConnectionConfig): Knex.Config {
    const { database, filename } = config;

    return {
      client: 'sqlite3',
      connection: {
        filename: filename || database,
      },
      useNullAsDefault: true,
    };
  }

  protected validateConfig(config: SqlConnectionConfig): void {
    const { database, filename } = config;

    if (!filename && !database) {
      throw new BadRequestException(
        'Invalid connection configuration: filename or database is required for SQLite',
      );
    }
  }

  async testConnection(config: SqlConnectionConfig): Promise<boolean> {
    this.validateConfig(config);

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      await db.raw('SELECT 1');
      this.logger.log('Connection to SQLite database successful');
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

    const cacheKey = `schemas:sqlite3:${config.database || config.filename}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex(this.buildKnexConfig(config));

    try {
      this.logger.log('Fetching SQLite schemas...');

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

      const schemas: SchemaMetadata[] = [{ name: 'main', tables }];

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
      // SQLite doesn't have schemas, but we can use the schema parameter as a prefix for tables if needed
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
    // SQLite doesn't support schemas
  }

  protected async hasTable(
    db: Knex,
    _schema: string,
    table: string,
  ): Promise<boolean> {
    return db.schema.hasTable(table);
  }

  protected async createTable(
    db: Knex,
    _schema: string,
    table: string,
    firstRow: ColumnValue[],
  ): Promise<void> {
    await db.schema.createTable(table, (t: Knex.CreateTableBuilder) => {
      t.increments('id').primary();
      for (const col of firstRow) {
        this.addColumnBySqliteType(t, col);
      }
    });
  }

  /**
   * Add column based on field type with SQLite-specific handling
   */
  private addColumnBySqliteType(
    t: Knex.CreateTableBuilder,
    col: ColumnValue,
  ): void {
    switch (col.type) {
      case FieldType.NUMBER:
        t.float(col.column);
        break;
      case FieldType.BOOLEAN:
        // SQLite doesn't have native boolean, uses integer
        t.integer(col.column);
        break;
      case FieldType.DATE:
      case FieldType.DATETIME:
        t.dateTime(col.column);
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

  protected async insertData(
    db: Knex,
    _schema: string,
    table: string,
    data: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
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

  private handleDatabaseError(
    err: unknown,
    schema: string,
    table: string,
  ): never {
    let errorCode = '';
    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;

    if (this.isDatabaseError(err)) {
      errorCode = err.code ?? err.errno ?? '';
      errorMessage = err.message ?? 'Unknown database error';
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    this.logger.error(
      `DB error inserting into ${schema}.${table}: ${errorCode} - ${errorMessage}`,
      errorStack,
    );

    if (errorCode === ERROR_CODES.UNIQUE_VIOLATION.sqlite3) {
      throw new ConflictException(
        'Duplicate key value violates unique constraint',
      );
    }

    if (errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION.sqlite3) {
      throw new BadRequestException('Invalid foreign key reference');
    }

    if (errorCode === ERROR_CODES.TABLE_NOT_FOUND.sqlite3) {
      throw new BadRequestException(
        `Table "${schema}.${table}" does not exist`,
      );
    }

    throw new InternalServerErrorException(errorMessage);
  }
}
