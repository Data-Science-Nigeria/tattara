import { Expose, Type } from 'class-transformer';

class WorkflowSummaryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

class UsersSummaryDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;
}

export class ProgramResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => WorkflowSummaryDto)
  workflows: WorkflowSummaryDto[];

  @Expose()
  @Type(() => UsersSummaryDto)
  users: UsersSummaryDto[];
}
