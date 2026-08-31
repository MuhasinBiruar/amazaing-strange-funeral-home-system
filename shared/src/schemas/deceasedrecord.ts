import { z } from 'zod';
import withNullDefault from './util/with-null-default';

export const createDeceasedRecordQuerySchema = z.object({
  firstname: z.string().min(1),
  middlename: withNullDefault(z.string().min(1)),
  lastname: z.string().min(1),
  causeofdeath: withNullDefault(z.string().min(1)),
  typeofdeath: withNullDefault(z.string().min(1)),
  physicaldescription: withNullDefault(z.string().min(1)),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  hasmaturedlifeplan: z.boolean(),
  plantype: z.enum(['Direct', 'Life', 'LGU']),
  datecreated: z.coerce.date(),
  dateofdeath: withNullDefault(z.coerce.date()),
  managedby: z.string().min(1),
  representedby: withNullDefault(z.int32()),
});

export const createDeceasedRecordBodySchema =
  createDeceasedRecordQuerySchema.omit({
    managedby: true,
  });

export const deceasedrecordPatchSchema =
  createDeceasedRecordQuerySchema.partial();
export type DeceasedRecordSchema = z.infer<typeof deceasedrecordPatchSchema>;
