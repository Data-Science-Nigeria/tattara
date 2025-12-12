import { PartialType } from '@nestjs/mapped-types';
import { CreateConnectionDto } from '.';

export class UpdateExternalConnDto extends PartialType(CreateConnectionDto) {}
