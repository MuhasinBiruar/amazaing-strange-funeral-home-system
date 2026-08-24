import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';

export const burialrecordSchema = z.object({
  burialdate: withNullDefault(z.coerce.date()),
  burialsite: withNullDefault(z.string().min(1)),
  caseid: z.int32(),
});

export type BurialRecordSchema = z.infer<typeof burialrecordSchema>;
