import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const lguCaseSchema = z.object({
  lgucaseid: z.int32(),
  reimbursementstatus: z.enum(['pending', 'approved', 'released', 'rejected']),
  reimbursementamount: z.float64().nonnegative(),
  caseid: z.int32(),
  // Nullable: LGU cases created before LGUs were tracked have none.
  lguid: withNullDefault(z.int32()),
});

export type LguCase = z.infer<typeof lguCaseSchema>;

export const createLguCaseQuery = lguCaseSchema.omit({
  lgucaseid: true,
});

export type CreateLguCaseQuery = z.infer<typeof createLguCaseQuery>;

export const updateLguCaseQuerySchema = lguCaseSchema
  .omit({ lgucaseid: true, caseid: true })
  .partial();

export type UpdateLguCaseQuery = z.infer<typeof updateLguCaseQuerySchema>;
