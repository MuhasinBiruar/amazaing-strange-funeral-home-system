import pool from '@/db';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { toExclusiveEndBound } from '@/util/date';

const dayTransactionsQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

/**
 * Every money movement (transactions + casket/formalin deliveries) in a
 * date range, for the day-level drill-down. Mirrors the sources combined
 * by `/financial/summary`, so totals here match what that endpoint shows.
 */
export async function getDayTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { startDate, endDate } = dayTransactionsQuerySchema.parse(req.query);
    const exclusiveEnd = toExclusiveEndBound(endDate);

    const result = await pool.query(
      `
      SELECT * FROM (
        SELECT
          t.transactionid::text AS id,
          'transaction'::text AS source,
          t.amount::numeric AS amount,
          (CASE WHEN t.paymentcategory = 'Refund' THEN 'out' ELSE 'in' END)::text AS direction,
          t.caseid::int AS caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, ''))::text AS deceased_name,
          t.paymentcategory::text AS category,
          t.paymentdatetime::timestamp AS datetime
        FROM public.transaction t
        LEFT JOIN public.deceasedrecord dr ON t.caseid = dr.caseid
        WHERE t.transactionstatus = 'completed'
          AND t.paymentdatetime >= $1 AND t.paymentdatetime < $2

        UNION ALL

        SELECT
          cd.deliveryid::text AS id,
          'casket'::text AS source,
          cd.totalamountpaid::numeric AS amount,
          'out'::text AS direction,
          NULL::int AS caseid,
          NULL::text AS deceased_name,
          'Casket delivery'::text AS category,
          cd.deliverydate::timestamp AS datetime
        FROM public.casketdelivery cd
        WHERE cd.deliverydate >= $1 AND cd.deliverydate < $2

        UNION ALL

        SELECT
          fd.deliveryid::text AS id,
          'formalin'::text AS source,
          fd.totalamountpaid::numeric AS amount,
          'out'::text AS direction,
          NULL::int AS caseid,
          NULL::text AS deceased_name,
          'Formalin delivery'::text AS category,
          fd.deliverydate::timestamp AS datetime
        FROM public.formalindelivery fd
        WHERE fd.deliverydate >= $1 AND fd.deliverydate < $2
      ) combined
      ORDER BY datetime DESC
      `,
      [startDate, exclusiveEnd],
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
}