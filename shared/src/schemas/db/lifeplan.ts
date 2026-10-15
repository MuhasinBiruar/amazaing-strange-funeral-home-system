import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const lifeplanSchema = z.object({
  planid: z.int32(),
  plannumber: withNullDefault(z.string().min(1)),
  planholdername: withNullDefault(z.string().min(1)),
  totalamount: withNullDefault(z.float64().min(1)),
  use_benefits: z.boolean().default(true),
  caseid: z.int32(),
  companyid: z.int32(),
});

export type Lifeplan = z.infer<typeof lifeplanSchema>;

export const createLifeplanQuery = lifeplanSchema.omit({
  planid: true,
});

export type CreateLifeplanQuery = z.infer<typeof createLifeplanQuery>;
