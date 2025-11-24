import { FieldType } from '../enums';

export type ValidationRules = {
  type?: FieldType;
  minLength?: number;
  maxLength?: number;
  regex?: RegExp;
  min?: number;
  max?: number;
  int?: boolean;
  before?: Date;
  after?: Date;
  options?: string[];
  minItems?: number;
  maxItems?: number;
  mustBeTrue?: boolean;
};
