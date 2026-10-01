import { bigNumberSchema } from '@/utils';
import z from 'zod';

export const transactionSchema = z.object({
  transactionid: z.int32(),
  amount: bigNumberSchema,
  paymentdatetime: z.coerce.date(),
  paymentmethod: z.enum([
    'Cash',
    'Bank Transfer',
    'GCash',
    'Check',
    'Credit Card',
  ]),
  paymentcategory: z.enum([
    'Down Payment',
    'Installment',
    'Full Payment',
    'Refund',
  ]),
  remainingbalance: bigNumberSchema,
  transactionstatus: z
    .enum(['pending', 'completed', 'failed', 'refunded'])
    .default('pending'),
  caseid: z.int32(),
});

export type Transaction = z.infer<typeof transactionSchema>;
