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
  deceased_name: z.string(),
  companyid: z.int32(),
  company_name: z.string(),
});

export type Lifeplan = z.infer<typeof lifeplanSchema>;

export const getLifeplansQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(lifeplanSchema).default('planid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLifeplansQuery = z.infer<typeof getLifeplansQuerySchema>;

export const getLifeplansResponseSchema = paginationResponseSchema.extend({
  data: z.array(lifeplanSchema),
});

export type GetLifeplansResponse = z.infer<typeof getLifeplansResponseSchema>;

export const createLifeplanQuery = lifeplanSchema.omit({
  planid: true,
  deceased_name: true,
  company_name: true,
});

export type CreateLifeplanQuery = z.infer<typeof createLifeplanQuery>;
