import { ExternalConnectionSummaryDto } from '@/modules/integration/dto';
import { Expose, Type } from 'class-transformer';

class Workflow {
  @Expose() id: string;
}

export class WorkflowConfigSummaryDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() type: string;
  @Expose() isActive: boolean;
  @Expose() configuration: object;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => ExternalConnectionSummaryDto)
  externalConnection?: ExternalConnectionSummaryDto;

  @Expose()
  @Type(() => Workflow)
  workflow?: Workflow;
}
