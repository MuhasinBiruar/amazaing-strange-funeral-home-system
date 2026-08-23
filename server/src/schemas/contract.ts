import z from 'zod';
import withNullDefault from './util/with-null-default.ts';

export const contractQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(21_474_836).default(1),
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

export const contractSchema = z.object({
  signeddate: z.coerce.date(),
  burialdatedeadline: z.coerce.date(),
  totalamount: z.float64(),
  embalmingperiod: z.int32(),
  inclusions: withNullDefault(z.string().min(1)),
  caseid: z.int32(),
  packageid: z.int32(),
});

export type ContractSchema = z.infer<typeof contractSchema>;
