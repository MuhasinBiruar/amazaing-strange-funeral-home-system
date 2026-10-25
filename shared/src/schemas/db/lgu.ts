import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

/**
 * A local government unit (city/municipality) that reimburses LGU cases,
 * the LGU counterpart of `lifeplancompany`.
 */
export const lguSchema = z.object({
  lguid: z.int32(),
  lguname: z.string().trim().min(1, 'LGU name is required.'),
  contactinfo: withNullDefault(z.string().trim().min(1)),
});

export type Lgu = z.infer<typeof lguSchema>;

export const createLguQuerySchema = lguSchema.omit({
  lguid: true,
});

export type CreateLguQuery = z.infer<typeof createLguQuerySchema>;
