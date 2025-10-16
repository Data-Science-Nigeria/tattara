import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { FieldType } from '@/common/enums';

export class CreateWorkflowFieldDto {
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsEnum(FieldType)
  @IsNotEmpty()
  fieldType: FieldType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsObject()
  @IsOptional()
  validationRules?: Record<string, any>;

  @IsObject()
  @IsOptional()
  aiMapping?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  displayOrder: number;
}
