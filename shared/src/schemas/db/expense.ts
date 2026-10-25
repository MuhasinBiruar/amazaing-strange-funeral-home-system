import { bigNumberSchema } from '@/utils/big-number-schema';
import z from 'zod';

export const expenseSchema = z.object({
  expenseid: z.number().int(),
  description: z.string().trim().min(1),
  amount: bigNumberSchema,
  expensedate: z.coerce.date(),
  recordedby: z.string(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseQuerySchema = expenseSchema.omit({
  expenseid: true,
  recordedby: true,
});

export type CreateExpenseQuery = z.infer<typeof createExpenseQuerySchema>;
