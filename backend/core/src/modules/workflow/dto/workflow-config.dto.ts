import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Event Config DTO
 */
export class EventConfigDto {
  @IsString()
  @IsNotEmpty()
  program: string;

  @IsNumber()
  orgUnit: number;
}

/**
 * Dataset Config DTO
 */
export class DatasetConfigDto {
  @IsString()
  @IsOptional()
  dataSet: string;

  @IsString()
  @IsNotEmpty()
  orgUnit: number;
}
