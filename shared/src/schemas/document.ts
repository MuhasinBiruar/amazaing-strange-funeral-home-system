import { z } from 'zod';
import withNullDefault from './util/with-null-default';

export const createDocumentQuerySchema = z.object({
  documenttype: z.string().min(1),
  verificationstatus: z.enum(['pending', 'verified', 'rejected']),
  uploaddate: z.coerce.date(),
  verifiedby: withNullDefault(z.string().min(1)),
  caseid: z.int(),
});

export type CreateDocumentQuery = z.infer<typeof createDocumentQuerySchema>;
