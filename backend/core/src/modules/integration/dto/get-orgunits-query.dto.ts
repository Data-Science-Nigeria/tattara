import { IsString } from 'class-validator';

export class GetOrgUnitsQueryDto {
  @IsString()
  id: string;

  @IsString()
  type: 'program' | 'dataset';
}
