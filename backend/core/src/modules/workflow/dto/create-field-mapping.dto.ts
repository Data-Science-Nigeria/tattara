import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsUUID,
} from 'class-validator';
import { IntegrationType } from '@/common/enums';

export class CreateFieldMappingDto {
  @IsUUID()
  @IsNotEmpty()
  workflowFieldId: string;

  @IsEnum(IntegrationType)
  @IsNotEmpty()
  targetType: IntegrationType;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'target cannot be an empty object' })
  target?: Record<string, any>;
}
