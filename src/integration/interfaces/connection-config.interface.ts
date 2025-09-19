export interface Dhis2Config {
    baseUrl: string;
    username?: string;
    password?: string;
    pat?: string;
    [key: string]: unknown; // for any extra fields
}

export interface PostgresConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    [key: string]: unknown; // for any extra fields
}

// Add more interfaces for other connection types as needed

export type ConnectionConfig = Dhis2Config | PostgresConfig;