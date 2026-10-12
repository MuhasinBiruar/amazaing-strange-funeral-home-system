import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lifeplanSchema } from '../db/lifeplan';

/**
 * Combination of the following tables:
 * `lifeplan` + `deceasedrecord` + `representative` + `lifeplancompany`
 */
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
