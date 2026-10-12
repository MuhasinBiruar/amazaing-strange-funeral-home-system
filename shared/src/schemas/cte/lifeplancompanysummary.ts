import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { lifeplanCompanySchema } from '../db/lifeplancompany';

/**
 * Combination of the following tables, grouped per company:
 * `lifeplancompany` + `lifeplan` + `deceasedrecord`
 *
 * `totalplans` and `total_serviced_amount` are computed per company.
 */
export const lifeplanCompanyAggregateSchema = lifeplanCompanySchema.extend({
  totalplans: z.int32().nonnegative(),
  total_serviced_amount: z.float64().nonnegative(),
});

export type LifeplanCompanyAggregate = z.infer<
  typeof lifeplanCompanyAggregateSchema
>;

export const getLifeplanCompaniesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
    sortBy: z.keyof(lifeplanCompanyAggregateSchema).default('companyid'),
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

export type GetLifeplanCompaniesQuery = z.infer<
  typeof getLifeplanCompaniesQuerySchema
>;

export const getLifeplanCompaniesResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(lifeplanCompanyAggregateSchema),
  });

export type GetLifeplanCompaniesResponse = z.infer<
  typeof getLifeplanCompaniesResponseSchema
>;
