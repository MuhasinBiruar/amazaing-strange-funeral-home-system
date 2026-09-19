import { z } from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import { nameSchema } from '@/utils/name-schema';

export const createDeceasedRecordQuerySchema = z.object({
  firstname: nameSchema('First name'),
  middlename: nameSchema('Middle name', false),
  lastname: nameSchema('Last name'),
  causeofdeath: withNullDefault(z.string().trim().min(1)),
  typeofdeath: withNullDefault(z.string().trim().min(1)),
  physicaldescription: withNullDefault(z.string().trim().min(1)),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  hasmaturedlifeplan: z.boolean(),
  plantype: z.enum(['Direct', 'Life', 'LGU']),
  datecreated: z.coerce.date(),
  dateofdeath: withNullDefault(z.coerce.date()),
  managedby: withNullDefault(z.string().min(1)),
  representedby: withNullDefault(z.int32()),
});

export type CreateDeceasedRecordQuery = z.infer<
  typeof createDeceasedRecordQuerySchema
>;

export const updateDeceasedRecordQuerySchema =
  createDeceasedRecordQuerySchema.partial();

export type UpdateDeceasedRecordQuery = z.infer<
  typeof updateDeceasedRecordQuerySchema
>;

export const deceasedRecordSchema = createDeceasedRecordQuerySchema.extend({
  caseid: z.int32(),
});

export type DeceasedRecord = z.infer<typeof deceasedRecordSchema>;

export const getDeceasedRecordResponseSchema = z.object({
  data: deceasedRecordSchema,
});

export type GetDeceasedRecordResponse = z.infer<
  typeof getDeceasedRecordResponseSchema
>;
