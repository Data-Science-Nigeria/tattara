import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  Matches,
  IsUrl,
} from 'class-validator';

/**
 * Postgres Config DTO
 */
export class PostgresConnectionConfigDto {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
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

/**
 * DHIS2 Config DTO
 */
export class Dhis2ConnectionConfigDto {
  @IsUrl({ require_tld: true, require_protocol: true })
  @Matches(/^https:\/\/.*\/dhis$/, {
    message:
      'baseUrl must be a valid DHIS2 endpoint, e.g. https://example.org/dhis',
  })
  baseUrl: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  pat: string;

  @IsString()
  @IsOptional()
  apiVersion?: string;

  @IsBoolean()
  @IsOptional()
  ssl?: boolean;

  @IsNumber()
  @IsOptional()
  timeout?: number;
}
