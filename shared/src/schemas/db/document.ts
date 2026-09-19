import { z } from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const createDocumentQuerySchema = z.object({
  documenttype: z.string().min(1),
  verificationstatus: z.enum(['pending', 'verified', 'rejected']),
  uploaddate: z.coerce.date(),
  verifiedby: withNullDefault(z.string().min(1)),
  caseid: z.int(),
  filename: withNullDefault(z.string().min(1)),
});

export type CreateDocumentQuery = z.infer<typeof createDocumentQuerySchema>;

/**
 * Fields the client sends when uploading a document as multipart form data.
 * The file itself is handled separately (by multer, server-side);
 * `verificationstatus`, `uploaddate`, `verifiedby` and `filename` are filled
 * in by the server, not the client.
 *
 * @remarks
 * `caseid` is `z.coerce` here (unlike {@link createDocumentQuerySchema}'s
 * plain `z.int()`) because multipart form fields always arrive as strings.
 */
export const uploadDocumentFormSchema = z.object({
  documenttype: z.string().min(1),
  caseid: z.coerce.number().int(),
});

export type UploadDocumentForm = z.infer<typeof uploadDocumentFormSchema>;

export const documentSchema = createDocumentQuerySchema.extend({
  documentid: z.int(),
});

export type Document = z.infer<typeof documentSchema>;

/** A document row plus a ready-to-use URL for viewing/downloading it. */
export const documentWithUrlSchema = documentSchema.extend({
  url: z.string().nullable(),
});

export type DocumentWithUrl = z.infer<typeof documentWithUrlSchema>;

export const getDocumentsQuerySchema = z.object({
  caseid: z.coerce.number().int().optional(),
});

export type GetDocumentsQuery = z.infer<typeof getDocumentsQuerySchema>;

export const getDocumentsResponseSchema = z.object({
  data: z.array(documentWithUrlSchema),
});

export type GetDocumentsResponse = z.infer<typeof getDocumentsResponseSchema>;
