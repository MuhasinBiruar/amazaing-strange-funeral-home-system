import { z } from 'zod';
import nullableStringField from './util/nullableStringField.ts';

export const documentsSchema = z.object({
  documenttype: z.string().min(1),
  verificationstatus: z.enum(['pending', 'verified', 'rejected']),
  uploaddate: z.coerce.date(),
  verifiedby: nullableStringField(),
  caseid: z.int(),
});

export type DocumentsSchemaType = z.infer<typeof documentsSchema>;
