import z from 'zod';

export const lguCaseSchema = z.object({
  lgucaseid: z.int32(),
  reimbursementstatus: z.enum(['pending', 'approved', 'released', 'rejected']),
  reimbursementamount: z.float64().nonnegative(),
  caseid: z.int32(),
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
