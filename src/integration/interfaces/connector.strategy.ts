export abstract class ConnectorStrategy {
    abstract testConnection(config: any): Promise<any>;
    abstract fetchSchemas(config: any): Promise<any>;
    abstract pushData(config: any, payload: any): Promise<any>;
}