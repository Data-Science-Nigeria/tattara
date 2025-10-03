import { ValidationRules } from '.';
import { FieldType } from '../enums';

export type FormField = {
  fieldName: string;
  label: string;
  isRequired: boolean;
  validationRules?: ValidationRules;
  fieldType: FieldType;
  options?: string[];
};
