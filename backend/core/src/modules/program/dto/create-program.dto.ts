import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
