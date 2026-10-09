import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { withNullDefault } from '@/utils/with-null-default';

export const lifeplanSchema = z.object({
  planid: z.int32(),
  plannumber: withNullDefault(z.string().min(1)),
  planholdername: withNullDefault(z.string().min(1)),
  totalamount: withNullDefault(z.float64().min(1)),
  caseid: z.int32(),
  companyid: z.int32(),
});

export type Lifeplan = z.infer<typeof lifeplanSchema>;

export const getLifeplansQueryRowSchema = lifeplanSchema.extend({
  deceased_name: z.string(),
  representative_name: z.string(),
  companyname: z.string(),
});

export type GetLifeplansQueryRow = z.infer<typeof getLifeplansQueryRowSchema>;

export const getLifeplansQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  companyid: z.coerce.number().int().positive().optional(),
  sortBy: z.keyof(getLifeplansQueryRowSchema).default('planid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLifeplansQuery = z.infer<typeof getLifeplansQuerySchema>;

export const getLifeplansResponseSchema = paginationResponseSchema.extend({
  data: z.array(getLifeplansQueryRowSchema),
});

export type GetLifeplansResponse = z.infer<typeof getLifeplansResponseSchema>;

export const createLifeplanQuery = lifeplanSchema.omit({
  planid: true,
});

export type CreateLifeplanQuery = z.infer<typeof createLifeplanQuery>;
