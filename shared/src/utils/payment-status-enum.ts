import z from 'zod';

/**
 * A case's payment progress against its contract, for filtering payment
 * lists: `paid` (nothing left to pay), `outstanding` (a balance is left) or
 * `nocontract` (no contract yet, so nothing to pay against).
 */
export const paymentStatusEnum = z.enum(['paid', 'outstanding', 'nocontract']);

export type PaymentStatus = z.infer<typeof paymentStatusEnum>;
