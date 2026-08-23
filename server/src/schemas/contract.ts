import z from 'zod';

export const contractQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(''),
  sortBy: z
    .enum([
      'contractid',
      'signeddate',
      'burialdatedeadline',
      'totalamount',
      'embalmingperiod',
      'caseid',
      'packageid',
    ])
    .default('contractid'),
  sortDir: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .default('DESC')
    .transform((val) => val.toUpperCase()),
});
