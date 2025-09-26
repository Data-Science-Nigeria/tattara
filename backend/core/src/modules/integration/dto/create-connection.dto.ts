import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IntegrationType } from 'src/common/enums';
import { Dhis2ConnectionConfigDto, PostgresConnectionConfigDto } from '.';

export class CreateConnectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IntegrationType)
  @IsString()
  @IsNotEmpty()
  type: IntegrationType;

  @ValidateNested()
  @Type(options => {
    const object = options?.object as CreateConnectionDto;
    if (object?.type === IntegrationType.POSTGRES) {
      return PostgresConnectionConfigDto;
    }
    if (object?.type === IntegrationType.DHIS2) {
      return Dhis2ConnectionConfigDto;
    }
    return Object;
  })
  @IsNotEmpty({ message: 'Configuration is required' })
  configuration: PostgresConnectionConfigDto | Dhis2ConnectionConfigDto;
}
