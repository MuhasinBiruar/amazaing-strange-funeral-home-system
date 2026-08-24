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
