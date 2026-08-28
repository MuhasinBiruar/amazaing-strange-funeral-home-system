import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from './util/pagination-schema';

export const lifeplanSchema = z.object({
  planid: z.int32(),
  plannumber: z.string().optional(),
  planholdername: z.string().optional(),
  minimumthreshold: z.float64().optional(),
  totalamount: z.float64().optional(),
  case_id: z.int32(),
  deceased_name: z.string(),
  company_id: z.int32(),
  company_name: z.string(),
});

export type Lifeplan = z.infer<typeof lifeplanSchema>;

export const lifeplanCompanySchema = z.object({
  companyid: z.int32(),
  companyname: z.string(),
  contactinfo: z.string().optional(),
});

export type LifeplanCompany = z.infer<typeof lifeplanCompanySchema>;

export const getLifeplansQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().optional(),
  sortBy: z.keyof(lifeplanSchema).default('planid'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetLifeplansQuery = z.infer<typeof getLifeplansQuerySchema>;

export const getLifeplansResponseSchema = z.object({
  ...paginationResponseSchema.shape,
  data: z.array(lifeplanSchema),
});

export type GetLifeplansResponse = z.infer<typeof getLifeplansResponseSchema>;
