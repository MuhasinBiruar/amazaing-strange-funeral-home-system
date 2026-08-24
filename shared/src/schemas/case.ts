import z from 'zod';

export const getCasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['intake', 'active', 'pending', 'completed']).optional(),
  sortBy: z
    .enum([
      'caseid',
      'deceased_name',
      'representative_name',
      'burialdatedeadline',
      'total_pending_docs',
      'totalamount',
      'deceased_status',
    ])
    .default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetCasesQuery = z.infer<typeof getCasesQuerySchema>;

export const caseSchema = z.object({
  caseid: z.int(),
  deceased_name: z.string(),
  representative_name: z.string(),
  burialdatedeadline: z.coerce.date(),
  total_pending_docs: z.int(),
  totalamount: z.number(),
  deceased_status: z.enum(['intake', 'active', 'pending', 'completed']),
});

export type Case = z.infer<typeof caseSchema>;

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
