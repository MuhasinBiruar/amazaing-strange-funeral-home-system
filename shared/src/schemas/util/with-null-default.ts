import { z } from 'zod';

/**
 * Makes a field optional then converts undefined values (or empty strings) to
 * null.
 */
export default function withNullDefault<T extends z.ZodType>(schema: T) {
  return schema
    .nullable()
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return null;

      if (
        schema instanceof z.ZodString &&
        typeof val === 'string' &&
        val.trim() === ''
      )
        return null;

      return val;
    });
}
