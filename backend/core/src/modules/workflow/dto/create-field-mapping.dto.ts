import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsUUID,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { IntegrationType } from '@/common/enums';

@ValidatorConstraint({ name: 'targetValidator', async: false })
class TargetValidator implements ValidatorConstraintInterface {
  validate(target: Record<string, unknown>, args: ValidationArguments) {
    const dto = args.object as CreateFieldMappingDto;

    if (!target || typeof target !== 'object') {
      return false;
    }

    if (dto.targetType === IntegrationType.DHIS2) {
      return (
        'dataElement' in target &&
        typeof target.dataElement === 'string' &&
        target.dataElement.length > 0
      );
    }

    if (dto.targetType === IntegrationType.POSTGRES) {
      return (
        'column' in target &&
        typeof target.column === 'string' &&
        target.column.length > 0
      );
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as CreateFieldMappingDto;

    if (dto.targetType === IntegrationType.DHIS2) {
      return 'For DHIS2, target must contain a non-empty "dataElement" property';
    }

    if (dto.targetType === IntegrationType.POSTGRES) {
      return 'For POSTGRES, target must contain a non-empty "column" property';
    }

    return 'Invalid target for the specified targetType';
  }
}

export class CreateFieldMappingDto {
  @IsUUID()
  @IsNotEmpty()
  workflowFieldId: string;

  @IsEnum(IntegrationType)
  @IsNotEmpty()
  targetType: IntegrationType;

  @IsObject()
  @IsNotEmptyObject({}, { message: 'target cannot be an empty object' })
  @Validate(TargetValidator)
  target: Record<string, unknown>;
}
