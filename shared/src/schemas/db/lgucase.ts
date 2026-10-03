import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

export const lguCaseSchema = z.object({
  lgucaseid: z.int32(),
  reimbursementstatus: z.enum(['pending', 'approved', 'released', 'rejected']),
  reimbursementamount: z.float64().nonnegative(),
  caseid: z.int32(),
});

export type LguCase = z.infer<typeof lguCaseSchema>;

export const getLguCasesRowSchema = lguCaseSchema.extend({
  deceased_name: z.string(),
});

export type GetLguCasesRow = z.infer<typeof getLguCasesRowSchema>;

export const getLguCasesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(getLguCasesRowSchema).default('lgucaseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLguCasesQuery = z.infer<typeof getLguCasesQuerySchema>;

export const getLguCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(getLguCasesRowSchema),
});

export type GetLguCasesResponse = z.infer<typeof getLguCasesResponseSchema>;

export const createLguCaseQuery = lguCaseSchema.omit({
  lgucaseid: true,
});

export type CreateLguCaseQuery = z.infer<typeof createLguCaseQuery>;

export const updateLguCaseQuerySchema = lguCaseSchema
  .omit({ lgucaseid: true, caseid: true })
  .partial();

export type UpdateLguCaseQuery = z.infer<typeof updateLguCaseQuerySchema>;
