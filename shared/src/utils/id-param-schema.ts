import { z } from 'zod';

/** Enforces that `id` must be a positive integer. */
export const idParamSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID must be a positive integer'),
});

/** Expects that `id` is a positive integer. */
export type IdParam = z.infer<typeof idParamSchema>;
