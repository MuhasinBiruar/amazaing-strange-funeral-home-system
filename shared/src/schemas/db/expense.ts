import { bigNumberSchema } from '@/utils/big-number-schema';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import z from 'zod';

export const expenseSchema = z.object({
  expenseid: z.number().int(),
  description: z.string().trim().min(1),
  amount: bigNumberSchema,
  expensedate: z.coerce.date(),
  recordedby: z.string(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const getExpensesRowSchema = expenseSchema.extend({
  staff_name: z.string(),
});

export type GetExpensesRow = z.infer<typeof getExpensesRowSchema>;

export const getExpensesQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  sortBy: z.keyof(getExpensesRowSchema).default('expensedate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetExpensesQuery = z.infer<typeof getExpensesQuerySchema>;

export const getExpensesResponseSchema = paginationResponseSchema.extend({
  data: z.array(getExpensesRowSchema),
});

export type GetExpensesResponse = z.infer<typeof getExpensesResponseSchema>;

//TODO: Make expensedate editable
export const createExpenseQuerySchema = expenseSchema.omit({
  expenseid: true,
  expensedate: true,
  recordedby: true,
});

export type CreateExpenseQuery = z.infer<typeof createExpenseQuerySchema>;
