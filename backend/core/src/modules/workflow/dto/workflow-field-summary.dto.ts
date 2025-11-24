import { Expose } from 'class-transformer';

export class WorkflowFieldSummaryDto {
  @Expose() id: string;
  @Expose() fieldName: string;
  @Expose() label: string;
  @Expose() fieldType: string;
  @Expose() options: string[];
  @Expose() isRequired: boolean;
  @Expose() displayOrder: number;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
