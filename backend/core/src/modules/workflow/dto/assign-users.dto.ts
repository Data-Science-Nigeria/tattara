import { IsArray, IsUUID } from 'class-validator';

export class AssignUsersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
