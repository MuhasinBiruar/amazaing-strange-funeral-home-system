import z from 'zod';
import withNullDefault from './util/with-null-default.ts';

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
