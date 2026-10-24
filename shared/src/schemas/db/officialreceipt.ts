import { bigNumberSchema, withNullDefault } from '@/utils';
import z from 'zod';

/**
 * An `officialreceipt` row.
 *
 * @remarks
 * `ornumber` is the pre-printed number from the receipt booklet, typed in
 * by hand, so no format is enforced. `discount_id` is the senior citizen /
 * PWD ID number. `pwd_discount` is a flat peso amount subtracted from the
 * total, not a percentage. `tin`, `withholding_tax`, `discount_id` and
 * `pwd_discount` are null when they don't apply.
 */
export const officialReceiptSchema = z.object({
  orid: z.int32(),
  ornumber: z.string(),
  amount: bigNumberSchema,
  issuedate: z.coerce.date(),
  reissuancecount: z.int32(),
  transactionid: z.int32(),
  total_due: bigNumberSchema,
  withholding_tax: withNullDefault(bigNumberSchema),
  tin: withNullDefault(z.string()),
  discount_id: withNullDefault(z.string()),
  pwd_discount: withNullDefault(bigNumberSchema),
});

export type OfficialReceipt = z.infer<typeof officialReceiptSchema>;

export const getOfficialReceiptsResponseSchema = z.object({
  data: z.array(officialReceiptSchema),
});

export type GetOfficialReceiptsResponse = z.infer<
  typeof getOfficialReceiptsResponseSchema
>;

const nonNegativeBigNumber = bigNumberSchema.refine((v) => Number(v) >= 0, {
  message: 'Must not be negative.',
});

/**
 * The official-receipt part of a payment request.
 * `amount`, `total_due` and `issuedate` are set by the server, and the
 * server rejects it unless the payment fully settles the case.
 */
export const createOfficialReceiptQuerySchema = z.object({
  ornumber: z.string().trim().min(1),
  tin: withNullDefault(
    z
      .string()
      .trim()
      .regex(/^\d{3}-\d{3}-\d{3}-\d{3,5}$/, {
        error: 'TIN must look like 123-456-789-000.',
      }),
  ),
  withholding_tax: withNullDefault(nonNegativeBigNumber),
  discount_id: withNullDefault(z.string().trim()),
  pwd_discount: withNullDefault(nonNegativeBigNumber),
});

export type CreateOfficialReceiptQuery = z.infer<
  typeof createOfficialReceiptQuerySchema
>;
