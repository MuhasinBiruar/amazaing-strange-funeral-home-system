import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';
import withNullDefault from './util/with-null-default';

export const lifeplanSchema = z.object({
  planid: z.int32(),
  plannumber: withNullDefault(z.string().min(1)),
  planholdername: withNullDefault(z.string().min(1)),
  minimumthreshold: withNullDefault(z.float64().min(0)),
  totalamount: withNullDefault(z.float64().min(1)),
  caseid: z.int32(),
  companyid: z.int32(),
});

export type Lifeplan = z.infer<typeof lifeplanSchema>;

export const lifeplanRowSchema = lifeplanSchema.extend({
  deceased_name: z.string(),
  company_name: z.string(),
});

export type LifeplanRow = z.infer<typeof lifeplanRowSchema>;

export const getLifeplansQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(lifeplanRowSchema).default('planid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLifeplansQuery = z.infer<typeof getLifeplansQuerySchema>;

export const getLifeplansResponseSchema = paginationResponseSchema.extend({
  data: z.array(lifeplanRowSchema),
});

export type GetLifeplansResponse = z.infer<typeof getLifeplansResponseSchema>;

export const createLifeplanQuery = lifeplanSchema.omit({
  planid: true,
});

export type CreateLifeplanQuery = z.infer<typeof createLifeplanQuery>;
