import type { ConnectionConfig } from '../interfaces/connection-config.interface';

export class ConnectionDto {
    type!: string;
    config!: ConnectionConfig;
}

export class PushDataDto {
    connection!: ConnectionDto;
    payload!: any;
}