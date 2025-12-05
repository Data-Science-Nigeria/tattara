import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class SubmitDto {
  @IsUUID()
  @IsNotEmpty()
  workflowId: string;

  /**
   * Single data entry - use this OR `dataEntries`, not both
   */
  @ValidateIf((o: SubmitDto) => !o.dataEntries)
  @IsObject()
  @IsNotEmptyObject({}, { message: 'data cannot be an empty object' })
  data?: Record<string, any>;

  /**
   * Multiple data entries for bulk submission
   */
  @ValidateIf((o: SubmitDto) => !o.data)
  @IsArray()
  @ArrayNotEmpty({ message: 'dataEntries cannot be an empty array' })
  dataEntries?: Record<string, any>[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  localId?: string;

  @IsUUID()
  @IsOptional()
  aiProcessingLogId?: string;
}
