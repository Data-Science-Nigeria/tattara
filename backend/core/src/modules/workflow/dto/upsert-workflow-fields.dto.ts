import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateWorkflowFieldDto } from '.';
import { PartialType } from '@nestjs/swagger';

export class Field extends PartialType(CreateWorkflowFieldDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class UpsertWorkflowFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Field)
  @IsNotEmpty()
  fields: Field[];
}
