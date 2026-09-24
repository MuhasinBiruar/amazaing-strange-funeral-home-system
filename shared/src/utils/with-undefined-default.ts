import { z } from 'zod';

/**
 * Converts empty values to undefined.
 */
export function withUndefinedDefault<T extends z.ZodType>(schema: T) {
  return z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  }, schema.optional());
}
