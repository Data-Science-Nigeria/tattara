import { IsOptional, IsString } from 'class-validator';

export class GetSchemasQueryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsOptional()
  type?: 'program' | 'dataset';
}
