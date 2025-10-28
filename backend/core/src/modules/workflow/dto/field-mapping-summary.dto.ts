import { Expose } from 'class-transformer';

export class FieldMappingSummaryDto {
  @Expose() id: string;
  @Expose() targetType: string;
  @Expose() target: object;
  @Expose() createdAt: Date;
}
