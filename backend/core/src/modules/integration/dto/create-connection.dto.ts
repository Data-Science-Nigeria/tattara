import { IntegrationType, SqlDatabaseType } from '@/common/enums';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Dhis2ConnectionConfigDto } from '.';

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
    if (object?.type === IntegrationType.DHIS2) {
      return Dhis2ConnectionConfigDto;
    }
    if (
      object?.type === IntegrationType.MYSQL ||
      object?.type === IntegrationType.SQLITE ||
      object?.type === IntegrationType.MSSQL ||
      object?.type === IntegrationType.ORACLE ||
      object?.type === IntegrationType.POSTGRES
    ) {
      return CreateSqlConnectionDto;
    }
    return Object;
  })
  @IsNotEmpty({ message: 'Configuration is required' })
  configuration: Dhis2ConnectionConfigDto | CreateSqlConnectionDto;
}

export class CreateSqlConnectionDto {
  @IsEnum(SqlDatabaseType)
  @IsString()
  @IsNotEmpty()
  client: SqlDatabaseType;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsNotEmpty()
  database: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  ssl?: boolean;
}
