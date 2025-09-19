import { Injectable, Logger } from '@nestjs/common';
import { ConnectorStrategy } from '../interfaces/connector.strategy';
import type { PostgresConfig } from '../interfaces/connection-config.interface';
import { Client, QueryResult } from 'pg';
import type {
    PostgresConnectionResponse,
    PostgresFetchSchemasResponse,
    PostgresPushDataResponse,
    SchemaRow,
    TableRow,
    ColumnRow,
    InsertedRow,
    InsertPayload
} from '../interfaces'

@Injectable()
export class PostgresStrategy extends ConnectorStrategy {
    private readonly logger = new Logger(PostgresStrategy.name);
    
    async testConnection(config: PostgresConfig): Promise<PostgresConnectionResponse> {
        const client = new Client({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
        });

        try {
            await client.connect();
            return { success: true, message: 'Connection successful' };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Connection failed: " + error.message);
                return { success: false, message: 'Connection failed', error: error.message };
            }
            this.logger.error("Connection failed: " + String(error));
            return { success: false, message: 'Connection failed', error: String(error) };
        } finally {
            await client.end();
        }
    }

    async fetchSchemas(config: PostgresConfig): Promise<PostgresFetchSchemasResponse> {
        const client = new Client({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
        });

            // Define a strict type for schemas
        type SchemaMap = {
            [schemaName: string]: {
                tables: {
                    [tableName: string]: {
                        columns: { name: string; type: string; nullable: boolean }[];
                    };
                };
            };
        };

        try {
            await client.connect();
            const result: QueryResult<SchemaRow> = await client.query<SchemaRow>(`
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
                ORDER BY schema_name;
            `);
            const schemas: SchemaMap = {};

            for (const row of result.rows) {
                const schemaName = row.schema_name;

                const tablesResult: QueryResult<TableRow> = await client.query<TableRow>(`
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = $1
                    ORDER BY table_name;
                `, [schemaName]);
                schemas[schemaName] = { tables: {} };

                for (const tableRow of tablesResult.rows) {
                    const tableName: string = tableRow.table_name;

                    const columnsResult: QueryResult<ColumnRow> = await client.query<ColumnRow>(`
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema = $1 AND table_name = $2
                        ORDER BY ordinal_position;
                    `, [schemaName, tableName]);
                    schemas[schemaName].tables[tableName] = {
                        columns: columnsResult.rows.map((col: ColumnRow) => ({
                            name: col.column_name,
                            type: col.data_type,
                            nullable: col.is_nullable === 'YES',
                        })),
                    };
                }
            }
            return { success: true, data: schemas };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to fetch schemas: " + error.message);
                return { success: false, message: 'Failed to fetch schemas', error: error.message };
            }
            this.logger.error("Failed to fetch schemas: " + String(error));
            return { success: false, message: 'Failed to fetch schemas', error: String(error) };
        } finally {
            await client.end();
        }
    }

    async pushData(config: PostgresConfig, payload: InsertPayload): Promise<PostgresPushDataResponse> {
        const client = new Client({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.database,
        });

        try {
            await client.connect();
            // Assuming payload contains the necessary data to insert/update
            const result = await client.query<InsertedRow>(`
                INSERT INTO your_table_name (column1, column2)
                VALUES ($1, $2)
                RETURNING *
            `, [payload.value1, payload.value2]);
            return { success: true, message: 'Data pushed successfully', data: result.rows[0] };
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error("Failed to push data: " + error.message);
                return { success: false, message: 'Failed to push data', error: error.message };
            }
            this.logger.error("Failed to push data: " + String(error));
            return { success: false, message: 'Failed to push data', error: String(error) };
        } finally {
            await client.end();
        }
    }
}