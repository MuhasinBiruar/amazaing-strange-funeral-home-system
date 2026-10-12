import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';

export const lifeplanCompanySchema = z.object({
  companyid: z.int32(),
  companyname: z.string().trim().min(1),
  contactinfo: withNullDefault(z.string().trim().min(1)),
  minimumthreshold: z.float32().nonnegative(),
});

export type LifeplanCompany = z.infer<typeof lifeplanCompanySchema>;

export const createLifeplanCompanyQuerySchema = lifeplanCompanySchema.omit({
  companyid: true,
});

export type CreateLifeplanCompanyQuery = z.infer<
  typeof createLifeplanCompanyQuerySchema
>;
