import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const lguCaseSchema = z.object({
  lgucaseid: z.int32(),
  reimbursementstatus: z.enum(['pending', 'approved', 'released', 'rejected']),
  reimbursementamount: z.float64(),
  caseid: z.int32(),
});

export type LguCase = z.infer<typeof lguCaseSchema>;

export const lguCaseRowSchema = lguCaseSchema.extend({
  deceased_name: z.string(),
});

export type LguCaseRow = z.infer<typeof lguCaseRowSchema>;

export const getLguCasesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(lguCaseRowSchema).default('lgucaseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLguCasesQuery = z.infer<typeof getLguCasesQuerySchema>;

export const getLguCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(lguCaseRowSchema),
});

export type GetLguCasesResponse = z.infer<typeof getLguCasesResponseSchema>;

export const createLguCaseQuery = lguCaseSchema.omit({ lgucaseid: true });

export type CreateLguCaseQuery = z.infer<typeof createLguCaseQuery>;
