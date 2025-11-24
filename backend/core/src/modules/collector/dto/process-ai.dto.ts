import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AiProviderType, ProcessingType } from '@/common/enums';

export class ProcessAiDto {
  @IsUUID()
  @IsNotEmpty()
  workflowId: string;

  @IsEnum(ProcessingType)
  @IsString()
  processingType: ProcessingType;

  @IsEnum(AiProviderType)
  @IsOptional()
  aiProvider?: AiProviderType;

  @IsString()
  @IsOptional()
  text?: string;
}
