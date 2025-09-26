import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegisterDto } from 'src/modules/auth/dto';

export class BulkCreateUsersDto {
  @ValidateNested({ each: true })
  @Type(() => RegisterDto)
  users: RegisterDto[];
}
