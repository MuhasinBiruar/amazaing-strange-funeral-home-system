import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';

export const documentSchema = z.object({
  documenttype: z.string().min(1),
  verificationstatus: z.enum(['pending', 'verified', 'rejected']),
  uploaddate: z.coerce.date(),
  verifiedby: withNullDefault(z.string().min(1)),
  caseid: z.int(),
});

export type DocumentSchemaType = z.infer<typeof documentSchema>;
