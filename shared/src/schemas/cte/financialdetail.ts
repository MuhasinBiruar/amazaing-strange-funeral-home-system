import z from 'zod';
import { bigNumberSchema } from '@/utils/big-number-schema';
import { expenseSchema } from '../db/expense';
import { transactionSchema } from '../db/transaction';

export const financialDetailSourceEnum = z.enum([
  'transaction',
  'casket',
  'formalin',
  'expense',
]);
export type FinancialDetailSource = z.infer<typeof financialDetailSourceEnum>;

export const financialDirectionEnum = z.enum(['in', 'out']);
export type FinancialDirection = z.infer<typeof financialDirectionEnum>;

/**
 * `transaction` + `casketdelivery` + `formalindelivery` + `expense` rows,
 * normalized into one list of money movements.
 *
 * @remarks
 * `id` is only unique *within* its `source` (each table has its own serial),
 * so `source` + `id` together are the real identity.
 */
export const financialDetailSchema = z.object({
  id: z.string(),
  source: financialDetailSourceEnum,
  direction: financialDirectionEnum,
  amount: bigNumberSchema,
  category: z.string(),
  datetime: z.coerce.date(),
  /** Only expenses have one. */
  description: expenseSchema.shape.description.nullable(),
  /** Only transactions are tied to a case. */
  caseid: transactionSchema.shape.caseid.nullable(),
  deceased_name: z.string().nullable(),
});

export type FinancialDetail = z.infer<typeof financialDetailSchema>;

export const getFinancialDetailsQuerySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.iso.datetime().or(z.iso.date()),
  })
  .refine((data) => data.startDate <= new Date(data.endDate), {
    message: 'endDate must be on or after startDate.',
    path: ['endDate'],
  });

export type GetFinancialDetailsQuery = z.infer<
  typeof getFinancialDetailsQuerySchema
>;

export const getFinancialDetailsResponseSchema = z.object({
  data: z.array(financialDetailSchema),
  meta: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }),
});

export type GetFinancialDetailsResponse = z.infer<
  typeof getFinancialDetailsResponseSchema
>;
