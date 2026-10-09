import z from 'zod';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

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

export const formalinUsageResponseSchema = z.object({
  data: formalinUsageSchema,
  inventory: z.object({
    currentstock: z.float64().nonnegative(),
    minimumthreshold: z.float64().nonnegative(),
  }),
  warning: z.string().nullable(),
});

export type FormalinUsageResponse = z.infer<typeof formalinUsageResponseSchema>;

export const getFormalinUsageResponseSchema = paginationResponseSchema.extend({
  data: z.array(formalinUsageSchema),
});

export type GetFormalinUsageResponse = z.infer<
  typeof getFormalinUsageResponseSchema
>;

const formalinUsageDateRangeQuerySchema = paginationQuerySchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.iso.datetime().or(z.iso.date()).optional(),
});

export const getFormalinUsageSummaryQuerySchema =
  formalinUsageDateRangeQuerySchema
    .extend({
      sortBy: z.enum(['usagedate', 'totalquantityused', 'actions']).default(
        'usagedate',
      ),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .refine(
      (data) =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= new Date(data.endDate),
      {
        message: 'endDate must be on or after startDate.',
        path: ['endDate'],
      },
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

export const getFormalinUsageBreakdownQuerySchema =
  formalinUsageDateRangeQuerySchema
    .extend({
      sortBy: z
        .enum(['usageid', 'quantityused', 'usagedate', 'casetype'])
        .default('usagedate'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
    .refine(
      (data) =>
        !data.startDate ||
        !data.endDate ||
        data.startDate <= new Date(data.endDate),
      {
        message: 'endDate must be on or after startDate.',
        path: ['endDate'],
      },
    );

export type GetFormalinUsageBreakdownQuery = z.infer<
  typeof getFormalinUsageBreakdownQuerySchema
>;
