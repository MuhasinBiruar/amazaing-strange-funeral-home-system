import z from 'zod';
import { withNullDefault } from './with-null-default';

export function nameSchema(fieldName: string, isRequired?: true): z.ZodString;
export function nameSchema(
  fieldName: string,
  isRequired: false,
): ReturnType<typeof withNullDefault<z.ZodString>>;

export function nameSchema(fieldName: string, isRequired = true) {
  let schema = z.string().trim();

  if (isRequired) schema = schema.min(1, `${fieldName} is required`);

  schema = schema
    .max(255, `${fieldName} must be at most 255 characters`)
    .regex(
      /^[\p{L}\p{M}\s'.,-]+$/u,
      `${fieldName} contains invalid characters`,
    );

  if (isRequired) return schema;

  return withNullDefault(schema);
}
