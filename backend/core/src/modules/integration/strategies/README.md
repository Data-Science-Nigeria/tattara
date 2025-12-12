# SQL Database Strategies

This folder contains database-specific strategy implementations for the integration module, supporting multiple SQL databases through a unified interface.

## Architecture

All strategies extend `BaseSqlStrategy` which provides common functionality and enforces a consistent interface for all databases.

```
ConnectorStrategy (abstract base)
       ↑
       │
BaseSqlStrategy (abstract SQL base)
       ↑
       ├─ PostgresStrategy (original)
       ├─ MysqlStrategy (new)
       ├─ SqliteStrategy (new)
       ├─ MssqlStrategy (new)
       ├─ OracleStrategy (new)
       └─ SqlDatabaseStrategy (generic fallback)

Other Strategies:
       ├─ Dhis2Strategy
```

## File Structure

- **`base-sql.strategy.ts`** - Abstract base class with shared SQL database functionality
  - Common error codes for all databases
  - Abstract methods each database must implement
  - Helper methods for column type handling and error detection

- **`postgres.strategy.ts`** - PostgreSQL (original implementation)
- **`mysql.strategy.ts`** - MySQL/MySQL2 database strategy
- **`sqlite.strategy.ts`** - SQLite database strategy
- **`mssql.strategy.ts`** - Microsoft SQL Server strategy
- **`oracle.strategy.ts`** - Oracle database strategy
- **`sql-database.strategy.ts`** - Generic SQL strategy (for dynamic routing)
- **`dhis2.strategy.ts`** - DHIS2 API strategy (unrelated to SQL)

## Usage

Each strategy is registered in `integration.module.ts` and can be selected based on the connection configuration's `client` type.

### Supported Database Types

```typescript
type SqlDatabaseType =
  | 'pg'
  | 'mysql'
  | 'mysql2'
  | 'sqlite3'
  | 'mssql'
  | 'oracledb';
```

### Example Connection Configs

**PostgreSQL:**

```typescript
{
  client: 'pg',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass'
}
```

**MySQL:**

```typescript
{
  client: 'mysql2', // or 'mysql' (auto-normalized)
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  username: 'user',
  password: 'pass'
}
```

**SQLite:**

```typescript
{
  client: 'sqlite3',
  database: './db.sqlite'
  // or filename: '/path/to/db.sqlite'
}
```

**MSSQL:**

```typescript
{
  client: 'mssql',
  host: 'localhost',
  port: 1433,
  database: 'mydb',
  username: 'user',
  password: 'pass'
}
```

**Oracle:**

```typescript
{
  client: 'oracledb',
  host: 'localhost',
  port: 1521,
  database: 'ORCLDB',
  username: 'user',
  password: 'pass'
}
```

## Key Features

### Database-Specific Implementations

Each strategy implements:

- **`testConnection()`** - Validates database connectivity
- **`fetchSchemas()`** - Retrieves database schemas, tables, and columns with caching
- **`pushData()`** - Inserts data, creating schemas/tables as needed

### Database-Specific Details

| Feature          | PostgreSQL         | MySQL              | SQLite        | MSSQL       | Oracle     |
| ---------------- | ------------------ | ------------------ | ------------- | ----------- | ---------- |
| Schema Support   | Yes                | As Database        | No            | Yes         | Yes        |
| RETURNING Clause | ✓                  | ✗                  | ✗             | ✓           | ✓          |
| Boolean Type     | Native             | TINYINT            | INTEGER       | BIT         | NUMBER     |
| Connection Info  | information_schema | information_schema | sqlite_master | sys.schemas | dba_tables |

### Error Handling

Each database has its own error code mapping for:

- Unique constraint violations
- Foreign key violations
- Table not found errors

These are automatically caught and converted to appropriate HTTP exceptions.

## Implementation Notes

- `mysql` client type is automatically normalized to `mysql2` (the modern driver)
- SQLite uses a single "main" schema
- MySQL treats each database as a schema
- All strategies support SSL connections where applicable
- Connection timeouts are configurable per connection
- Schema/table metadata is cached for 5 minutes per connection

## Adding New Database Support

To add a new database:

1. Create a new strategy file: `yourdb.strategy.ts`
2. Extend `BaseSqlStrategy`
3. Implement all abstract methods
4. Add error codes to `ERROR_CODES` in `base-sql.strategy.ts`
5. Register in `integration.module.ts`
6. Update `SqlDatabaseType` in `external-connection-config.interface.ts`
