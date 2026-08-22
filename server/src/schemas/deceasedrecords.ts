import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';

export const deceasedrecordsSchema = z.object({
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
  managedby: withNullDefault(z.string().min(1)),
  representedby: z.int32(),
});

export type DeceasedRecordsSchema = z.infer<typeof deceasedrecordsSchema>;
