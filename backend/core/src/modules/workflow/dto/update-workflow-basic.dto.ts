import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Mode } from '@/common/enums';

export class UpdateWorkflowBasicDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @IsArray()
  @IsEnum(Mode, { each: true })
  @IsOptional()
  enabledModes?: Mode[];
}
