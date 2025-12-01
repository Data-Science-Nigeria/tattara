import { Expose } from 'class-transformer';

export class ProgramSummaryDto {
  @Expose() id: string;
  @Expose() name: string;
}
