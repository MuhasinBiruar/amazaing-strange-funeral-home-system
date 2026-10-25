import z from 'zod';
import { bigNumberSchema } from '@/utils/big-number-schema';
import {
  dateFilteredPaginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';

/**
 * Where an expense log row comes from: a general `expense`, or the amount
 * paid for a casket or formalin delivery.
 */
export const expenseLogSourceEnum = z.enum(['expense', 'casket', 'formalin']);

export type ExpenseLogSource = z.infer<typeof expenseLogSourceEnum>;

/**
 * Combination of the following tables:
 * `expense` (+ `staff`) + `casketdelivery` (+ `casketinventory`) +
 * `formalindelivery`
 *
 * @remarks
 * Delivery costs are listed here rather than copied into `expense`, because
 * the financial summary already counts deliveries as money out; copying them
 * would count each delivery twice. Deliveries with nothing paid are left out.
 *
 * `id` is only unique within its own `source` table, so `source` + `id`
 * together identify a row. Deliveries don't record who entered them, so
 * `recordedby` and `staff_name` are `null` for them.
 */
export const expenseLogSchema = z.object({
  source: expenseLogSourceEnum,
  id: z.int32(),
  description: z.string(),
  amount: bigNumberSchema,
  expensedate: z.coerce.date(),
  recordedby: z.string().nullable(),
  staff_name: z.string().nullable(),
});

export type ExpenseLog = z.infer<typeof expenseLogSchema>;

/**
 * @remarks
 * `startDate`/`endDate` filter on `expensedate` (the delivery date for
 * delivery rows).
 */
export const getExpenseLogQuerySchema = z.intersection(
  dateFilteredPaginationQuerySchema,
  z.object({
    search: z.string().optional(),
    source: expenseLogSourceEnum.optional(),
    sortBy: z.keyof(expenseLogSchema).default('expensedate'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export type GetExpenseLogQuery = z.infer<typeof getExpenseLogQuerySchema>;

export const getExpenseLogResponseSchema = paginationResponseSchema.extend({
  data: z.array(expenseLogSchema),
});

export type GetExpenseLogResponse = z.infer<typeof getExpenseLogResponseSchema>;
