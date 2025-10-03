import { IntegrationType } from '../enums';

export type Dhis2Mapping = { dataElement: string; value: string };
export type PostgresMapping = { table: string; column: string; value: string };

export type ExtractedData = {
  [IntegrationType.DHIS2]?: Dhis2Mapping[];
  [IntegrationType.POSTGRES]?: PostgresMapping[];
};
