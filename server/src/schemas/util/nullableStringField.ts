import { z } from 'zod';

export default function nullableStringField() {
  return z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? null);
}
