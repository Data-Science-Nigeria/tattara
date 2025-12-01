import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Mode } from '@/common/enums';
import { CreateWorkflowConfigurationDto, CreateWorkflowFieldDto } from '.';

export class CreateWorkflowDto {
  @IsUUID()
  @IsOptional()
  programId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLanguages?: string[];

  @IsArray()
  @IsEnum(Mode, { each: true })
  @IsNotEmpty()
  enabledModes: Mode[];

  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowFieldDto)
  @IsNotEmpty()
  workflowFields: CreateWorkflowFieldDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowConfigurationDto)
  @IsNotEmpty()
  workflowConfigurations: CreateWorkflowConfigurationDto[];
}
