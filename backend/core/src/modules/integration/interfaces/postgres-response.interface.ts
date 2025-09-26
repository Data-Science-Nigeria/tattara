export interface PostgresConnectionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface PostgresColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface PostgresTable {
  columns: PostgresColumn[];
}

export interface PostgresSchema {
  tables: Record<string, PostgresTable>;
}

export interface PostgresFetchSchemasResponse {
  success: boolean;
  data?: Record<string, PostgresSchema>;
  message?: string;
  error?: string;
}

export interface PostgresPushDataResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface SchemaRow {
  schema_name: string;
}

export interface TableRow {
  table_name: string;
}

export interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
}

export interface InsertedRow {
  id: number;
  column1: string;
  column2: string;
}

export interface InsertPayload {
  value1: string | number; // adjust as needed
  value2: string | number;
}

export interface PushPayload {
  schema: string;
  table: string;
  values: { column: string; value: string }[];
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableMetadata {
  name: string;
  columns: ColumnMetadata[];
}

export interface SchemaMetadata {
  name: string;
  tables: TableMetadata[];
}
