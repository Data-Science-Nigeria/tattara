export interface DataValue {
  dataElement: string;
  dataElementName: string;
  value: any;
}

export interface SchemaProgramResponse {
  program: string;
  orgUnit: string;
  eventDate: string;
  status: string;
  dataValues: DataValue[];
}

export interface SchemaDatasetResponse {
  dataSet: string;
  completeDate: string;
  period: string;
  orgUnit: string;
  dataValues: DataValue[];
}

export interface EventPayload {
  program: string;
  programStage: string;
  orgUnit: string;
  eventDate: string;
  status: string;
  dataValues: DataValue[];
}

export interface DatasetPayload {
  dataSet: string;
  completeDate: string;
  period: string;
  orgUnit: string;
  dataValues: DataValue[];
}

export interface ProgramDataElement {
  id: string;
  displayName: string;
  valueType: string;
}

export interface ProgramStage {
  id: string;
  displayName: string;
  repeatable: boolean;
  dataElements: ProgramDataElement[];
}

export interface OrgUnit {
  id: string;
  displayName: string;
}

export interface ProgramResponse {
  id: string;
  displayName: string;
  programType: 'WITH_REGISTRATION' | 'WITHOUT_REGISTRATION';
  version: number;
  lastUpdated: string;
  organisationUnits: OrgUnit[];
  programStages: ProgramStage[];
}

export interface FetchProgramsResponse {
  programs: ProgramResponse[];
}

export interface DatasetDataElement {
  id: string;
  displayName: string;
  valueType: string;
}

export interface DatasetResponse {
  id: string;
  displayName: string;
  periodType: string; // e.g., "Monthly", "Quarterly"
  version: number;
  lastUpdated: string;
  organisationUnits: OrgUnit[];
  dataSetElements: DatasetDataElement[];
}

export interface FetchDatasetsResponse {
  dataSets: DatasetResponse[];
}

export interface Dhis2SystemInfo {
  contextPath: string;
  systemId: string;
  systemName: string;
  systemVersion: string;
  systemDate: string;
  serverDate: string;
  calendar: string;
  dateFormat: string;
  version: string;
  revision: string;
  buildTime: string;
  jasperReportsVersion: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  data?: Dhis2SystemInfo;
}

export interface ImportCount {
  imported: number;
  updated: number;
  ignored: number;
  deleted: number;
}

export interface Dhis2ImportSummary {
  responseType: string; // e.g. "ImportSummary"
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  importCount: ImportCount;
  conflicts?: Array<{ object: string; value: string }>;
  dataSetComplete?: string;
  reference?: string;
  href?: string;
}

export interface PushDataResponse {
  success: boolean;
  message: string;
  data: Dhis2ImportSummary;
}
