import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { IntegrationType } from 'src/common/enums';
import type { ExternalConnectionConfiguration } from 'src/common/interfaces';

export class ConnectionDto {
  @IsEnum(IntegrationType)
  @IsNotEmpty()
  type: IntegrationType;

  @IsObject()
  @IsNotEmpty()
  config: ExternalConnectionConfiguration;
}

export class PushDataDto {
  @ValidateNested()
  @Type(() => ConnectionDto)
  connection!: ConnectionDto;

  @IsObject()
  payload!: any;
}
