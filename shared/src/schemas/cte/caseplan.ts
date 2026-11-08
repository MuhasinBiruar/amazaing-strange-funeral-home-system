import z from 'zod';
import { deceasedRecordSchema } from '../db/deceasedrecord';
import { lguCaseSchema } from '../db/lgucase';
import { lifeplanSchema } from '../db/lifeplan';

/**
 * Combination of the following tables:
 * `deceasedrecord.plantype` + its `lifeplan` (+ `lifeplancompany`) or
 * `lgucase` (+ `lgu`)
 *
 * @remarks
 * A Life case has exactly one `lifeplan` row and an LGU case one `lgucase`
 * row; other cases have neither.
 */
export const casePlanSchema = z.object({
  plantype: deceasedRecordSchema.shape.plantype,
  lifeplan: lifeplanSchema
    .extend({ companyname: z.string().nullable() })
    .nullable(),
  lgucase: lguCaseSchema.extend({ lguname: z.string().nullable() }).nullable(),
});

export type CasePlan = z.infer<typeof casePlanSchema>;

export const getCasePlanResponseSchema = z.object({
  data: casePlanSchema,
});

/** The life plan details a Life case needs, as intake asks for them. */
export const casePlanLifeplanSchema = z.object({
  companyid: z.int32({ error: 'Please select a lifeplan company.' }),
  plannumber: z
    .string({ error: 'Plan number is required.' })
    .trim()
    .min(1, 'Plan number is required.'),
  planholdername: z
    .string({ error: 'Plan holder name is required.' })
    .trim()
    .min(1, 'Plan holder name is required.'),
  totalamount: z
    .number({ error: 'Total amount is required.' })
    .positive('Total amount must be greater than zero.'),
  use_benefits: z.boolean(),
});

/** The LGU details an LGU case needs, as intake asks for them. */
export const casePlanLguCaseSchema = z.object({
  lguid: z.int32({ error: 'Please select an LGU.' }),
  reimbursementstatus: lguCaseSchema.shape.reimbursementstatus,
  reimbursementamount: z
    .number({ error: 'Reimbursement amount is required.' })
    .nonnegative('Reimbursement amount cannot be negative.'),
});

/**
 * Sets a case's plan type along with the life plan or LGU details it needs.
 * Switching away from Life or LGU removes the old life plan / LGU record.
 */
export const updateCasePlanQuerySchema = z.discriminatedUnion('plantype', [
  z.object({ plantype: z.literal('Direct') }),
  z.object({ plantype: z.literal('Life'), lifeplan: casePlanLifeplanSchema }),
  z.object({ plantype: z.literal('LGU'), lgucase: casePlanLguCaseSchema }),
]);

export type UpdateCasePlanQuery = z.infer<typeof updateCasePlanQuerySchema>;
