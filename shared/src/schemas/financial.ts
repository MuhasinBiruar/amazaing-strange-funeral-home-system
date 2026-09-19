import { z } from 'zod';
import { bigNumberSchema } from '../utils/big-number-schema';
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

export const dayTransactionsQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
export type DayTransactionsQuery = z.infer<typeof dayTransactionsQuerySchema>;

export type GetFinancialSummaryResponse = z.infer<
  typeof getFinancialSummaryResponseSchema
>;


export type PaymentCategory = z.infer<typeof paymentCategoryEnum>;

export const paymentCategoryEnum = z.enum([
  'Down Payment',
  'Installment',
  'Full Payment',
  'Refund',
]);

export const paymentMethodEnum = z.enum([
  'Cash',
  'Bank Transfer',
  'GCash',
  'Check',
  'Credit Card',
]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;


export const transactionStatusEnum = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
]);
export type TransactionStatus = z.infer<typeof transactionStatusEnum>;

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentcategory: paymentCategoryEnum,
  paymentmethod: paymentMethodEnum,
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;