import z from 'zod';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { formalinInventorySchema } from './formalininventory';

export const formalinUsageSchema = z.object({
  usageid: z.int32(),
  quantityused: z.float64().positive(),
  usagedate: z.coerce.date(),
  casetype: z.string().nullable(),
  caseid: z.int32(),
  formalinid: z.int32(),
});

export type FormalinUsage = z.infer<typeof formalinUsageSchema>;

export const createFormalinUsageSchema = z.object({
  quantityused: z.float64().positive(),
  minimumthreshold: z.float64().nonnegative(),
  caseid: z.int32(),
  formalinid: z.int32(),
});

export type CreateFormalinUsage = z.infer<typeof createFormalinUsageSchema>;

export const createFormalinUsageResponseSchema = z.object({
  data: z.object({
    usage: formalinUsageSchema,
    inventory: formalinInventorySchema.pick({
      currentstock: true,
      minimumthreshold: true,
    }),
  }),
  meta: z.object({
    warning: z.string().nullable(),
  }),
});

export type CreateFormalinUsageResponse = z.infer<
  typeof createFormalinUsageResponseSchema
>;

export const getFormalinUsageResponseSchema = paginationResponseSchema.extend({
  data: z.array(formalinUsageSchema),
});

export type GetFormalinUsageResponse = z.infer<
  typeof getFormalinUsageResponseSchema
>;

export const getFormalinUsageSummaryQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    sortBy: z
      .enum(['usagedate', 'totalquantityused', 'actions'])
      .default('usagedate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetFormalinUsageSummaryQuery = z.infer<
  typeof getFormalinUsageSummaryQuerySchema
>;

export const formalinUsageSummarySchema = z.object({
  usagedate: z.iso.date(),
  totalquantityused: z.float64().positive(),
});

export type FormalinUsageSummary = z.infer<typeof formalinUsageSummarySchema>;

export const getFormalinUsageSummaryResponseSchema =
  paginationResponseSchema.extend({
    data: z.array(formalinUsageSummarySchema),
  });

export type GetFormalinUsageSummaryResponse = z.infer<
  typeof getFormalinUsageSummaryResponseSchema
>;

export const getFormalinUsageBreakdownQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    sortBy: z
      .enum(['usageid', 'quantityused', 'usagedate', 'casetype'])
      .default('usagedate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetFormalinUsageBreakdownQuery = z.infer<
  typeof getFormalinUsageBreakdownQuerySchema
>;
