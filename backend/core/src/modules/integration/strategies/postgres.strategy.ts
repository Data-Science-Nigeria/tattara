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
import { DatabaseError } from 'pg';
import type { PostgresConnectionConfig } from 'src/common/interfaces';
import type { PushPayload, SchemaMetadata, TableMetadata } from '../interfaces';
import { ConnectorStrategy } from '../interfaces/connector.strategy';

@Injectable()
export class PostgresStrategy extends ConnectorStrategy {
  private readonly logger = new Logger(PostgresStrategy.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    super();
  }

  async testConnection(
    connectionConfig: PostgresConnectionConfig,
  ): Promise<boolean> {
    const db: Knex = knex({
      client: 'pg',
      connection: {
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.username,
        password: connectionConfig.password,
        database: connectionConfig.database,
      },
    });

    try {
      this.logger.log(
        `Testing connection to ${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`,
      );

      await db.raw('SELECT 1');

      this.logger.log('Connection successful');
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

  async fetchSchemas(
    config: PostgresConnectionConfig,
  ): Promise<SchemaMetadata[]> {
    const cacheKey = `schemas:${config.host}:${config.port}:${config.database}`;

    const cached = await this.cache.get<SchemaMetadata[]>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const db: Knex = knex({
      client: 'pg',
      connection: {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
      },
    });

    try {
      this.logger.log('Fetching schemas, tables, and columns metadata...');

      // Row types
      type SchemaRow = { schema_name: string };
      type TableRow = { table_name: string };
      type ColumnRow = {
        column_name: string;
        data_type: string;
        is_nullable: string;
      };

      // 2. Get all schemas
      const schemaRows: SchemaRow[] = await db
        .select<SchemaRow[]>('schema_name')
        .from('information_schema.schemata')
        .whereNotIn('schema_name', ['pg_catalog', 'information_schema']);

      // 3. Fetch schemas + tables + columns in parallel
      const schemas: SchemaMetadata[] = await Promise.all(
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
    connectionConfig: PostgresConnectionConfig,
    payload: PushPayload,
  ): Promise<R[]> {
    const db = knex({
      client: 'pg',
      connection: {
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.username,
        password: connectionConfig.password,
        database: connectionConfig.database,
      },
    });

    const { schema, table, values } = payload;

    // Build object for insert
    const insertObj = values.reduce(
      (acc, v) => ({ ...acc, [v.column]: v.value }),
      {},
    );

    try {
      // Ensure schema exists
      await db.raw(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

      // Ensure table exists
      const hasTable = await db.schema.withSchema(schema).hasTable(table);

      if (!hasTable) {
        await db.schema
          .withSchema(schema)
          .createTable(table, (t: Knex.CreateTableBuilder) => {
            t.increments('id').primary();

            for (const col of values) {
              // Naive column type inference (you can improve this mapping)
              if (typeof col.value === 'number') {
                t.float(col.column);
              } else if (typeof col.value === 'boolean') {
                t.boolean(col.column);
              } else if ((col.value as any) instanceof Date) {
                t.timestamp(col.column);
              } else {
                t.text(col.column);
              }
            }
          });
      }

      // Insert data
      const result = await db
        .withSchema(schema)
        .table(table)
        .insert(insertObj)
        .returning('*');
      return result as R[];
    } catch (err: any) {
      if (this.isDatabaseError(err)) {
        this.logger.error(
          `DB error inserting into ${schema}.${table}: ${err.code} - ${err.message}`,
          err.stack,
        );

        switch (err.code) {
          case '23505':
            throw new ConflictException(
              'Duplicate key value violates unique constraint',
            );
          case '23503':
            throw new BadRequestException('Invalid foreign key reference');
          case '42P01':
            throw new BadRequestException(
              `Table "${schema}.${table}" does not exist`,
            );
          default:
            throw new InternalServerErrorException(err.message);
        }
      }

      this.logger.error(`Unexpected error: ${String(err)}`);
      throw new InternalServerErrorException('Unexpected database error');
    } finally {
      await db.destroy();
    }
  }

  private isDatabaseError(err: unknown): err is DatabaseError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      'message' in err
    );
  }
}
