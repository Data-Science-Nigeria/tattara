import type { ExternalConnectionConfiguration } from 'src/common/interfaces';
import { Dhis2ImportSummary } from '.';

export abstract class ConnectorStrategy {
  abstract testConnection(
    config: ExternalConnectionConfiguration,
  ): Promise<boolean>;
  abstract fetchSchemas(
    connectionConfig: ExternalConnectionConfiguration,
  ): Promise<any>;
  abstract pushData<R>(
    config: ExternalConnectionConfiguration,
    payload: unknown,
  ): Promise<Dhis2ImportSummary | R[]>;
}
