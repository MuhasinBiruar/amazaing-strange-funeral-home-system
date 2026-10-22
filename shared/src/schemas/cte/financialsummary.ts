import { z } from 'zod';
import { bigNumberSchema } from '@/utils/big-number-schema';
import { dateUnitEnum } from '@/utils/date-unit-enum';
import { dateFilteredQuerySchema } from '@/utils';

export const getFinancialSummaryQuerySchema = z.intersection(
  dateFilteredQuerySchema,
  z.object({
    unit: dateUnitEnum.default('month'),
    interval: z.coerce.number().int().min(1).max(1000).default(1),
    caseid: z.coerce.number().int().positive().optional(),
  }),
);

export type GetFinancialSummaryQuery = z.infer<
  typeof getFinancialSummaryQuerySchema
>;

export const financialBucketSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalIn: bigNumberSchema,
  totalOut: bigNumberSchema,
  transactionCount: z.int(),
});

export type FinancialBucket = z.infer<typeof financialBucketSchema>;

export const getFinancialSummaryResponseSchema = z.object({
  data: z.array(financialBucketSchema),
  meta: z.object({
    unit: dateUnitEnum,
    interval: z.int(),
    startDate: z.coerce.date().nullable(),
    endDate: z.coerce.date().nullable(),
    totalIn: bigNumberSchema,
    totalOut: bigNumberSchema,
  }),
});

export type GetFinancialSummaryResponse = z.infer<
  typeof getFinancialSummaryResponseSchema
>;
