import { z } from "zod";

function nullableStringField() {
  return z.string().nullable().optional().transform((val) => val ?? null);
}

const deceasedrecordsSchema = z.object({
  firstname: z.string().min(1),
  middlename: nullableStringField(),
  lastname: z.string().min(1),
  causeofdeath: nullableStringField(),
  typeofdeath: nullableStringField(),
  physicaldescription: nullableStringField(),
  servicestatus: z.enum(['intake', 'active', 'pending', 'completed']),
  hasmaturedlifeplan: z.boolean(),
  plantype: z.enum(['Direct', 'Life', 'LGU']),
  datecreated: z.coerce.date(),
  managedby: nullableStringField(),
});

export default deceasedrecordsSchema;