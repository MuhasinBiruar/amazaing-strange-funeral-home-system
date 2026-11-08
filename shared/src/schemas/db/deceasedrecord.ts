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
  plantype: z.enum(['Direct', 'Life', 'LGU']),
  datecreated: z.coerce.date(),
  dateofdeath: withNullDefault(z.coerce.date()),
  locationofdeath: withNullDefault(z.string().trim().min(1).max(255)),
  managedby: withNullDefault(z.string().min(1)),
  representedby: withNullDefault(z.int32()),
  // Setting a default would reset the flag on unrelated PATCHes.
  hasadvanceddecomposition: z.boolean().optional(),
});

export type CreateDeceasedRecordQuery = z.infer<
  typeof createDeceasedRecordQuerySchema
>;

/**
 * @remarks
 * `plantype` isn't here: changing it also has to add or remove the case's
 * life plan / LGU record, so it goes through `updateCasePlanQuerySchema`.
 */
export const updateDeceasedRecordQuerySchema = createDeceasedRecordQuerySchema
  .omit({ plantype: true })
  .partial();

export type UpdateDeceasedRecordQuery = z.infer<
  typeof updateDeceasedRecordQuerySchema
>;

export const deceasedRecordSchema = createDeceasedRecordQuerySchema.extend({
  caseid: z.int32(),
  /**
   * Every life plan the home takes is matured, so the server keeps this equal
   * to `plantype === 'Life'`; it isn't set by staff.
   */
  hasmaturedlifeplan: z.boolean(),
  hasadvanceddecomposition: z.boolean(),
});

export type DeceasedRecord = z.infer<typeof deceasedRecordSchema>;

export const getDeceasedRecordResponseSchema = z.object({
  data: deceasedRecordSchema,
});

export type GetDeceasedRecordResponse = z.infer<
  typeof getDeceasedRecordResponseSchema
>;
