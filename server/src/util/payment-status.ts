import type { PaymentStatus } from 'shared/utils';

/**
 * SQL condition matching cases in the given {@link PaymentStatus}.
 *
 * @param totalSql - The contract's amount due (`contract.totalamount`), NULL
 * when there's no contract. Official receipt deductions are already taken
 * off it when recorded.
 * @param paidSql - The net amount paid (refunds subtracted).
 *
 * @remarks
 * "Paid" uses the same test as the service status sweep
 * (`totalpaid >= totalamount`).
 */
export function paymentStatusCondition(
  status: PaymentStatus,
  totalSql: string,
  paidSql: string,
) {
  switch (status) {
    case 'nocontract':
      return `${totalSql} IS NULL`;
    case 'paid':
      return `${totalSql} IS NOT NULL AND ${paidSql} >= ${totalSql}`;
    case 'outstanding':
      return `${totalSql} IS NOT NULL AND ${paidSql} < ${totalSql}`;
  }
}
