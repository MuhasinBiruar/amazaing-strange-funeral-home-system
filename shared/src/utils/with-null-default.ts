import { z } from 'zod';

/**
 * Converts empty or undefined values to null.
 */
export function withNullDefault<T extends z.ZodType>(schema: T) {
  return z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() === '') return null;
      return val;
    }, schema.nullable().optional())
    .transform((val) => val ?? null);
}
