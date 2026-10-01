import pool from '@/db';
import type { NextFunction, Request, Response } from 'express';
import {
  getFinancialDetailsQuerySchema,
  type GetFinancialDetailsResponse,
} from 'shared';
import { toExclusiveEndBound } from '@/util/date';

/**
 * Every money movement (transactions, casket/formalin deliveries, general
 * expenses) in a date range. The row-level counterpart of
 * `/financial/summary`, which aggregates the same four sources.
 */
export async function getFinancialDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { startDate, endDate } = getFinancialDetailsQuerySchema.parse(
      req.query,
    );
    const exclusiveEnd = toExclusiveEndBound(endDate);

    // Technically, we should add AT TIME ZONE 'UTC' but timestamp set in the
    // database is already in UTC so it's fine for now.
    const result = await pool.query(
      `
      SELECT * FROM (
        SELECT
          t.transactionid::text AS id,
          'transaction'::text AS source,
          (CASE WHEN t.paymentcategory = 'Refund' THEN 'out' ELSE 'in' END)::text AS direction,
          t.amount::numeric AS amount,
          t.paymentcategory::text AS category,
          NULL::text AS description,
          t.caseid::int AS caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, ''))::text AS deceased_name,
          t.paymentdatetime::timestamp AS datetime
        FROM public.transaction t
        LEFT JOIN public.deceasedrecord dr ON t.caseid = dr.caseid
        WHERE t.transactionstatus = 'completed'
          AND t.paymentdatetime >= $1 AND t.paymentdatetime < $2

        UNION ALL

        SELECT
          cd.deliveryid::text,
          'casket'::text,
          'out'::text,
          cd.totalamountpaid::numeric,
          'Casket delivery'::text,
          NULL::text,
          NULL::int,
          NULL::text,
          cd.deliverydate::timestamp
        FROM public.casketdelivery cd
        WHERE cd.deliverydate >= $1 AND cd.deliverydate < $2

        UNION ALL

        SELECT
          fd.deliveryid::text,
          'formalin'::text,
          'out'::text,
          fd.totalamountpaid::numeric,
          'Formalin delivery'::text,
          NULL::text,
          NULL::int,
          NULL::text,
          fd.deliverydate::timestamp
        FROM public.formalindelivery fd
        WHERE fd.deliverydate >= $1 AND fd.deliverydate < $2

        UNION ALL

        SELECT
          e.expenseid::text,
          'expense'::text,
          'out'::text,
          e.amount::numeric,
          'General expense'::text,
          e.description::text,
          NULL::int,
          NULL::text,
          e.expensedate::timestamp
        FROM public.expense e
        WHERE e.expensedate >= $1 AND e.expensedate < $2
      ) combined
      ORDER BY datetime DESC
      `,
      [startDate, exclusiveEnd],
    );

    res.json({ data: result.rows } satisfies GetFinancialDetailsResponse);
  } catch (error) {
    next(error);
  }
}
