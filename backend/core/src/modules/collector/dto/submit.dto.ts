import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class SubmitDto {
  @IsUUID()
  @IsNotEmpty()
  workflowId: string;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'data cannot be an empty object' })
  data: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata: Record<string, any>;

  @IsUUID()
  @IsOptional()
  localId?: string;

  @IsUUID()
  @IsOptional()
  aiProcessingLogId?: string;
}
