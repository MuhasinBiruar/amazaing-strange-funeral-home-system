import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

export const lifeplanCompanySchema = z.object({
  companyid: z.int32(),
  companyname: z.string().trim().min(1),
  contactinfo: withNullDefault(z.string().trim().min(1)),
  minimumthreshold: z.float32().nonnegative(),
});

export type LifeplanCompany = z.infer<typeof lifeplanCompanySchema>;

export const lifeplanCompanyAggregateSchema = lifeplanCompanySchema.extend({
  totalplans: z.int32().nonnegative(),
  total_serviced_amount: z.float64().nonnegative(),
});

export type LifeplanCompanyAggregate = z.infer<
  typeof lifeplanCompanyAggregateSchema
>;

export const createLifeplanCompanyQuerySchema = lifeplanCompanySchema.omit({
  companyid: true,
});

export type CreateLifeplanCompanyQuery = z.infer<
  typeof createLifeplanCompanyQuerySchema
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
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
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
