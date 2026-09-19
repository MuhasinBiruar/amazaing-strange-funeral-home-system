import { z } from 'zod';
import { bigNumberSchema } from '@/utils/big-number-schema';
import { dateUnitEnum } from '@/utils/date-unit-enum';

export const getFinancialSummaryQuerySchema = z
  .object({
    unit: dateUnitEnum.default('month'),
    interval: z.coerce.number().int().min(1).max(1000).default(1),
    startDate: z.coerce
      .date()
      .optional()
      .default(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d;
      }),
    endDate: z.iso.datetime().or(z.iso.date()).optional(),
    caseid: z.coerce.number().int().positive().optional(),
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
