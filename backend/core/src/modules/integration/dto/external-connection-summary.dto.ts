import { Expose } from 'class-transformer';

export class ExternalConnectionSummaryDto {
  @Expose() id: string;
}
