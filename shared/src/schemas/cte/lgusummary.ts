import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lguSchema } from '../db/lgu';

/**
 * Combination of the following tables, grouped per LGU:
 * `lgu` + `lgucase` + `deceasedrecord`
 *
 * `totalrecords` and `total_serviced_amount` are computed per LGU.
 */
export const lguAggregateSchema = lguSchema.extend({
  totalrecords: z.int32().nonnegative(),
  total_serviced_amount: z.float64().nonnegative(),
});

export type LguAggregate = z.infer<typeof lguAggregateSchema>;

export const getLgusQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    sortBy: z.keyof(lguAggregateSchema).default('lguid'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.startDate <= data.endDate,
    {
      message: 'endDate must be on or after startDate.',
      path: ['endDate'],
    },
  );

export type GetLgusQuery = z.infer<typeof getLgusQuerySchema>;

export const getLgusResponseSchema = paginationResponseSchema.extend({
  data: z.array(lguAggregateSchema),
});

export type GetLgusResponse = z.infer<typeof getLgusResponseSchema>;
