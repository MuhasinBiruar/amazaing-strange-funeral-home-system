import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const directPlanSchema = z.object({
  caseid: z.int32(),
  deceased_name: z.string(),
  representativeid: z.int32().nullable(),
  representative_name: z.string(),
  contractid: z.int32().nullable(),
  totalamount: z.float64().nullable(),
  totalamountpaid: z.float64(),
});

export type DirectPlan = z.infer<typeof directPlanSchema>;

export const getDirectPlansQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(directPlanSchema).default('caseid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetDirectPlansQuery = z.infer<typeof getDirectPlansQuerySchema>;

export const getDirectPlansResponseSchema = paginationResponseSchema.extend({
  data: z.array(directPlanSchema),
});

export type GetDirectPlansResponse = z.infer<
  typeof getDirectPlansResponseSchema
>;
