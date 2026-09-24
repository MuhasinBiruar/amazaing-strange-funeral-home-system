import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID must be a positive integer'),
});

export type IdParam = z.infer<typeof idParamSchema>;
