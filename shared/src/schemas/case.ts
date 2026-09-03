import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const caseSchema = z.object({
  deceased_name: z.string(),
  representative_name: z.string(),
  burialdatedeadline: z.coerce.date(),
  total_pending_docs: z.int(),
  totalamount: z.number(),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  datecreated: z.coerce.date(),
  managed_by_name: z.string().optional(),
  caseid: z.int(),
  contractid: z.int(),
  representativeid: z.int().nullable(),
  staffid: z.string(),
});

export type Case = z.infer<typeof caseSchema>;

export const getCasesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: caseSchema.shape.servicestatus.optional(),
  sortBy: z.keyof(caseSchema).default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetCasesQuery = z.infer<typeof getCasesQuerySchema>;

export const getCasesResponseSchema = paginationResponseSchema.extend({
  data: z.array(caseSchema),
});

export type GetCasesResponse = z.infer<typeof getCasesResponseSchema>;
