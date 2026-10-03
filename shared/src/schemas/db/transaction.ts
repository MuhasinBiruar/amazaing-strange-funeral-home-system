import { bigNumberSchema, withNullDefault } from '@/utils';
import z from 'zod';

export const paymentMethodEnum = z.enum([
  'Cash',
  'Bank Transfer',
  'GCash',
  'Check',
  'Credit Card',
]);

export const paymentCategoryEnum = z.enum([
  'Down Payment',
  'Installment',
  'Full Payment',
  'Refund',
]);

export const transactionStatusEnum = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const transactionSchema = z.object({
  transactionid: z.int32(),
  amount: bigNumberSchema,
  paymentdatetime: z.coerce.date(),
  paymentmethod: paymentMethodEnum,
  paymentcategory: paymentCategoryEnum,
  remainingbalance: bigNumberSchema,
  transactionstatus: transactionStatusEnum.default('pending'),
  caseid: z.int32(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/**
 * `caseid` comes from the URL
 * `remainingbalance` and `transactionstatus` are set by the server.
 */
export const createTransactionQuerySchema = z.object({
  amount: bigNumberSchema.refine((v) => Number(v) > 0, {
    message: 'Amount must be greater than zero.',
  }),
  paymentdatetime: withNullDefault(z.coerce.date()),
  paymentmethod: paymentMethodEnum,
  paymentcategory: paymentCategoryEnum,
});

export type CreateTransactionQuery = z.infer<
  typeof createTransactionQuerySchema
>;

export const createTransactionResponseSchema = z.object({
  data: transactionSchema,
});

export type CreateTransactionResponse = z.infer<
  typeof createTransactionResponseSchema
>;
