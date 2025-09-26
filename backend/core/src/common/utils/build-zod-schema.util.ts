import { z } from 'zod';
import { FieldType } from '../enums';
import { FormField } from '../interfaces';
import { BadRequestException } from '@nestjs/common';

type FormDefinition = FormField[];

export function buildZodSchema(formDef: FormDefinition) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of formDef) {
    const { fieldName, isRequired, fieldType, validationRules, options } =
      field;

    let schema: z.ZodTypeAny;

    switch (fieldType) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
        schema = z.string();
        if (validationRules?.minLength)
          schema = z.string().min(validationRules.minLength);
        if (validationRules?.maxLength)
          schema = z.string().max(validationRules.maxLength);
        if (validationRules?.regex)
          schema = z.string().regex(validationRules.regex);
        break;

      case FieldType.NUMBER:
        schema = z.number();
        if (validationRules?.min) schema = z.number().min(validationRules.min);
        if (validationRules?.max) schema = z.number().max(validationRules.max);
        if (validationRules?.int) schema = z.number().int();
        break;

      // case FieldType.DATE:
      //   schema = z.date();
      //   if (validationRules?.before)
      //     schema = z.date().max(validationRules.before);
      //   if (validationRules?.after)
      //     schema = z.date().min(validationRules.after);
      //   break;

      // case FieldType.DATETIME:
      //   schema = z.date();
      //   break;

      case FieldType.DATE:
        schema = z
          .string()
          .refine(val => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
          })
          .transform(val => new Date(val));

        if (validationRules?.before) {
          schema = schema.pipe(z.date().max(validationRules.before));
        }
        if (validationRules?.after) {
          schema = schema.pipe(z.date().min(validationRules.after));
        }
        break;

      case FieldType.DATETIME:
        schema = z
          .string()
          .refine(val => !isNaN(Date.parse(val)), {
            message: 'Invalid datetime format',
          })
          .transform(val => new Date(val));
        break;

      case FieldType.SELECT:
        if (!options) {
          throw new BadRequestException(
            `Field "${fieldName}" of type SELECT must have options`,
          );
        }
        schema = z.enum([...options] as [string, ...string[]]);
        break;

      case FieldType.MULTISELECT:
        if (!options) {
          throw new BadRequestException(
            `Field "${fieldName}" of type MULTISELECT must have options`,
          );
        }
        schema = z.array(z.enum([...options] as [string, ...string[]]));
        if (validationRules?.minItems)
          schema = z
            .array(z.enum([...options] as [string, ...string[]]))
            .min(validationRules?.minItems);
        if (validationRules?.maxItems)
          schema = z
            .array(z.enum([...options] as [string, ...string[]]))
            .max(validationRules?.maxItems);
        break;

      case FieldType.BOOLEAN:
        schema = z.boolean();
        if (validationRules?.mustBeTrue) {
          schema = schema.refine(val => val === true, {
            message: 'Must be true',
          });
        }
        break;

      case FieldType.EMAIL:
        schema = z.email();
        break;

      case FieldType.PHONE:
        schema = z
          .string()
          .regex(
            validationRules?.regex ?? /^\+?[1-9]\d{1,14}$/,
            'Invalid phone number',
          );
        break;

      case FieldType.URL:
        schema = z.url();
        break;

      default:
        schema = z.any();
    }

    if (!isRequired) {
      schema = schema.optional();
    }

    shape[fieldName] = schema;
  }

  return z.object(shape).strict();
}
