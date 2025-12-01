import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
} from 'class-validator';
import { IntegrationType } from '@/common/enums';

export class CreateConfigurationDto {
  @IsEnum(IntegrationType)
  @IsNotEmpty()
  type: IntegrationType;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'configuration cannot be an empty object' })
  configuration: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
