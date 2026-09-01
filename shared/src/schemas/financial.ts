import { z } from 'zod';

export const financialUnitEnum = z.enum(['day', 'week', 'month', 'year']);
export type FinancialUnit = z.infer<typeof financialUnitEnum>;

export const getFinancialSummaryQuerySchema = z.object({
  unit: financialUnitEnum.default('month'),
  interval: z.coerce.number().int().min(1).max(1000).default(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  caseid: z.coerce.number().int().positive().optional(),
});

export type GetFinancialSummaryQuery = z.infer<
  typeof getFinancialSummaryQuerySchema
>;

export const financialBucketSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  totalIn: z.number(),
  totalOut: z.number(),
  transactionCount: z.int(),
});

export type FinancialBucket = z.infer<typeof financialBucketSchema>;

export const getFinancialSummaryResponseSchema = z.object({
  data: z.array(financialBucketSchema),
  meta: z.object({
    unit: financialUnitEnum,
    interval: z.int(),
    startDate: z.coerce.date().nullable(),
    endDate: z.coerce.date().nullable(),
    totalIn: z.number(),
    totalOut: z.number(),
  }),
});

export type GetFinancialSummaryResponse = z.infer<
  typeof getFinancialSummaryResponseSchema
>;
