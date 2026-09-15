import z from 'zod';
import withNullDefault from './util/with-null-default';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const lifeplanCompanySchema = z.object({
  companyid: z.int32(),
  companyname: z.string().trim().min(1),
  contactinfo: withNullDefault(z.string().trim().min(1)),
});

export type LifeplanCompany = z.infer<typeof lifeplanCompanySchema>;

export const createLifeplanCompanyQuerySchema = lifeplanCompanySchema.omit({
  companyid: true,
});

export type CreateLifeplanCompanyQuery = z.infer<
  typeof createLifeplanCompanyQuerySchema
>;

export const getLifeplanCompaniesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(lifeplanCompanySchema).default('companyid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLifeplanCompaniesQuery = z.infer<
  typeof getLifeplanCompaniesQuerySchema
>;

export const getLifeplanCompaniesResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(lifeplanCompanySchema),
  });

export type GetLifeplanCompaniesResponse = z.infer<
  typeof getLifeplanCompaniesResponseSchema
>;
