import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
} from 'class-validator';
import { IntegrationType } from 'src/common/enums';

export class CreateWorkflowConfigurationDto {
  @IsEnum(IntegrationType)
  @IsNotEmpty()
  type: IntegrationType;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'Configuration cannot be an empty object' })
  configuration: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
