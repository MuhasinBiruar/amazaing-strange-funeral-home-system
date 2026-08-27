import z from 'zod';

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
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: caseSchema.shape.servicestatus.optional(),
  sortBy: z.keyof(caseSchema).default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetCasesQuery = z.infer<typeof getCasesQuerySchema>;

export const getCasesResponseSchema = z.object({
  data: z.array(caseSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetCasesResponse = z.infer<typeof getCasesResponseSchema>;
