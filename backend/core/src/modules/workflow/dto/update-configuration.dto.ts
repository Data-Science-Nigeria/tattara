import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { IntegrationType } from '@/common/enums';

export class UpdateConfigurationDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsOptional()
  externalConnectionId?: string;

  @IsEnum(IntegrationType)
  @IsOptional()
  type?: IntegrationType;

  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
