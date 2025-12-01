import { ProgramSummaryDto } from '@/modules/program/dto';
import { UserSummaryDto } from '@/modules/user/dto';
import { Expose, Type } from 'class-transformer';
import { FieldMappingSummaryDto, WorkflowFieldSummaryDto } from '.';
import { WorkflowConfigSummaryDto } from './workflow-config-summary.dto';

export class WorkflowResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() description: string;
  @Expose() status: string;
  @Expose() supportedLanguages: string[];
  @Expose() enabledModes: string[];
  @Expose() version: string;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  @Expose()
  @Type(() => ProgramSummaryDto)
  program?: ProgramSummaryDto;

  @Expose()
  @Type(() => WorkflowConfigSummaryDto)
  workflowConfigurations: WorkflowConfigSummaryDto[];

  @Expose()
  @Type(() => WorkflowFieldSummaryDto)
  workflowFields: WorkflowFieldSummaryDto[];

  @Expose()
  @Type(() => FieldMappingSummaryDto)
  fieldMappings: FieldMappingSummaryDto[];

  @Expose()
  @Type(() => UserSummaryDto)
  createdBy: UserSummaryDto;

  @Expose()
  @Type(() => UserSummaryDto)
  users: UserSummaryDto[];
}
