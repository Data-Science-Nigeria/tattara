import { IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { ExternalConnectionConfiguration } from 'src/common/interfaces';
import { IntegrationType } from 'src/common/enums';

export class ConnectionDto {
  @IsString()
  type!: IntegrationType;

  @IsObject()
  config!: ExternalConnectionConfiguration;
}

export class PushDataDto {
  @ValidateNested()
  @Type(() => ConnectionDto)
  connection!: ConnectionDto;

  @IsObject()
  payload!: any;
}
