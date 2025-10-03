import { IsArray, IsUUID } from 'class-validator';

export class AssignUsersToProgramDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
