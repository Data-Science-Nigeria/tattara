import { IntegrationType } from '../enums';

export type Mapping = {
  dataElement?: string;
  table?: string;
  column?: string;
  value: string;
  type?: string;
  isNullable?: boolean;
};

export type ExtractedData = Partial<{
  [IntegrationType.DHIS2]: Mapping[];
  [IntegrationType.POSTGRES]: Mapping[];
  [IntegrationType.MYSQL]: Mapping[];
  [IntegrationType.SQLITE]: Mapping[];
  [IntegrationType.MSSQL]: Mapping[];
  [IntegrationType.ORACLE]: Mapping[];
}>;
