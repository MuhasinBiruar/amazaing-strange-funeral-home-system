import { z } from 'zod';

export default function withNullDefault<T extends z.ZodType>(field: T) {
  return field
    .nullable()
    .optional()
    .transform((val) => val ?? null);
}
