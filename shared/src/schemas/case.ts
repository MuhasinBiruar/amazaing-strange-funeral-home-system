import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const caseSchema = z.object({
  caseid: z.int(),
  deceased_name: z.string(),
  representative_name: z.string(),
  burialdatedeadline: z.coerce.date(),
  total_pending_docs: z.int(),
  totalamount: z.number(),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  datecreated: z.coerce.date(),
  managed_by_name: z.string().optional(),
});

export type Case = z.infer<typeof caseSchema>;

export const getCasesQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().optional(),
  status: caseSchema.shape.servicestatus.optional(),
  sortBy: z.keyof(caseSchema).default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetCasesQuery = z.infer<typeof getCasesQuerySchema>;

export const getCasesResponseSchema = z.object({
  ...paginationResponseSchema.shape,
  data: z.array(caseSchema),
});

export type GetCasesResponse = z.infer<typeof getCasesResponseSchema>;
