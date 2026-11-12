import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const createContractQuerySchema = z.object({
  signeddate: z.coerce.date(),
  burialdatedeadline: z.coerce.date(),
  totalamount: z.float64(),
  embalmingperiod: z.int32(),
  inclusions: withNullDefault(z.string().min(1)),
  caseid: z.int32(),
  packageid: z.int32(),
  useLifeplanAmount: z.boolean().default(true),
});

export type CreateContractQuery = z.infer<typeof createContractQuerySchema>;

export const contractSchema = z.object({
  contractid: z.int32(),
  signeddate: z.coerce.date(),
  burialdatedeadline: z.coerce.date(),
  totalamount: z.coerce.number(),
  embalmingperiod: z.int32(),
  inclusions: z.string().nullable(),
  caseid: z.int32(),
  packageid: z.int32(),
});

export type Contract = z.infer<typeof contractSchema>;

export const getContractResponseSchema = z.object({
  data: contractSchema,
});

/**
 * What can be changed on a contract after it's made. Totals and the package
 * stay as they were agreed.
 */
export const updateContractQuerySchema = z.object({
  /** `yyyy-mm-dd`; on or after the contract's signed date. */
  burialdatedeadline: z.iso.date({ error: 'Pick a burial deadline.' }),
});

export type UpdateContractQuery = z.infer<typeof updateContractQuerySchema>;
