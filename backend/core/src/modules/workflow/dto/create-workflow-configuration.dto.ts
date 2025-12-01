import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { IntegrationType } from '@/common/enums';

export class CreateWorkflowConfigurationDto {
  @IsEnum(IntegrationType)
  @IsNotEmpty()
  type: IntegrationType;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'Configuration cannot be an empty object' })
  configuration: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  externalConnectionId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
