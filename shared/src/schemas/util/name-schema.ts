import z from 'zod';
import withNullDefault from './with-null-default';

export default function nameSchema(
  fieldName: string,
  isRequired?: true,
): z.ZodString;
export default function nameSchema(
  fieldName: string,
  isRequired: false,
): ReturnType<typeof withNullDefault<z.ZodString>>;

export default function nameSchema(fieldName: string, isRequired = true) {
  const schema = z
    .string()
    .trim()
    .max(255, `${fieldName} must be at most 255 characters`)
    .regex(
      /^[\p{L}\p{M}\s'.,-]+$/u,
      `${fieldName} contains invalid characters`,
    );

  if (isRequired) return schema.min(1, `${fieldName} is required`);

  return withNullDefault(schema);
}
