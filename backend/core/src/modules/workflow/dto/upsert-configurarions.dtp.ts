import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { UpdateConfigurationDto } from '.';

export class UpsertConfigurationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateConfigurationDto)
  @IsNotEmpty()
  configs: UpdateConfigurationDto[];
}
