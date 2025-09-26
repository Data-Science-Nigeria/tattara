import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateFieldMappingDto } from '.';

export class UpsertFieldMappingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldMappingDto)
  @IsNotEmpty()
  fieldMappings: CreateFieldMappingDto[];
}
