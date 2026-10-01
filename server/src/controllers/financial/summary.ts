import pool from '@/db';
import { toExclusiveEndBound } from '@/util/date';
import { foldPeriods, GetBucketsQuerySchema } from '@/util/financial';
import { getFinancialSummaryQuerySchema } from 'shared';
import type { NextFunction, Request, Response } from 'express';

export const getFinancialSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { unit, interval, startDate, endDate, caseid } =
      getFinancialSummaryQuerySchema.parse(req.query);

    const parsedEndDate = endDate ? new Date(endDate) : null;

    const transactionWhereConditions: string[] = [
      `transactionstatus = 'completed'`,
    ];

    const deliveryWhereConditions: string[] = [];
    const expenseWhereConditions: string[] = [];

    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      transactionWhereConditions.push(`paymentdatetime >= $${paramIndex}`);
      deliveryWhereConditions.push(`deliverydate >= $${paramIndex}`);
      expenseWhereConditions.push(`expensedate >= $${paramIndex}`);

      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      transactionWhereConditions.push(`paymentdatetime < $${paramIndex}`);
      deliveryWhereConditions.push(`deliverydate < $${paramIndex}`);
      expenseWhereConditions.push(`expensedate < $${paramIndex}`);

      queryParams.push(toExclusiveEndBound(endDate));
      paramIndex++;
    }

    if (caseid !== undefined) {
      // Deliveries and expenses do not have a caseid column, so this filter
      // only applies to transactions.
      transactionWhereConditions.push(`caseid = $${paramIndex}`);
      queryParams.push(caseid);
      paramIndex++;
    }

    const transactionWhereClause = `WHERE ${transactionWhereConditions.join(' AND ')}`;

    const deliveryWhereClause = deliveryWhereConditions.length
      ? `WHERE ${deliveryWhereConditions.join(' AND ')}`
      : '';

    const expenseWhereClause = expenseWhereConditions.length
      ? `WHERE ${expenseWhereConditions.join(' AND ')}`
      : '';

    // Technically, we should add AT TIME ZONE 'UTC' but timestamp set in the
    // database is already in UTC so it's fine for now.
    const result = await pool.query(
      `
      WITH combined_financials AS (
        -- Transactions
        SELECT
          date_trunc(
            '${unit}',
            paymentdatetime AT TIME ZONE 'UTC'
          ) AS period,

          COALESCE(
            SUM(amount) FILTER (
              WHERE paymentcategory = 'Refund'
            ),
            0
          ) AS totalout,

          COALESCE(
            SUM(amount) FILTER (
              WHERE NOT (paymentcategory = 'Refund')
            ),
            0
          ) AS totalin,

          COUNT(*)::bigint AS transactioncount

        FROM public.transaction
        ${transactionWhereClause}

        GROUP BY period

        UNION ALL

        -- Casket Deliveries
        SELECT
          date_trunc('${unit}', deliverydate::timestamp) AS period,
          COALESCE(SUM(totalamountpaid), 0) AS totalout,
          0::double precision AS totalin,
          0::bigint AS transactioncount

        FROM public.casketdelivery
        ${deliveryWhereClause}

        GROUP BY period

        UNION ALL

        -- Formalin Deliveries
        SELECT
          date_trunc('${unit}', deliverydate::timestamp) AS period,
          COALESCE(SUM(totalamountpaid), 0) AS totalout,
          0::double precision AS totalin,
          0::bigint AS transactioncount

        FROM public.formalindelivery
        ${deliveryWhereClause}

        GROUP BY period

        UNION ALL

        -- General Expenses
        SELECT
          date_trunc('${unit}', expensedate::timestamp AT TIME ZONE 'UTC') AS period,
          COALESCE(SUM(amount), 0) AS totalout,
          0::double precision AS totalin,
          0::bigint AS transactioncount
          
        FROM public.expense
        ${expenseWhereClause}

        GROUP BY period
      )

      SELECT
        period,
        COALESCE(SUM(totalout), 0)::text AS totalout,
        COALESCE(SUM(totalin), 0)::text AS totalin,
        COALESCE(SUM(transactioncount), 0)::bigint AS transactioncount
      FROM combined_financials
      GROUP BY period
      ORDER BY period ASC;
      `,
      queryParams,
    );

    const { buckets, totalIn, totalOut } = foldPeriods(
      GetBucketsQuerySchema.parse(result.rows),
      unit,
      interval,
      startDate ?? null,
      parsedEndDate,
    );

    res.json({
      data: buckets,
      meta: {
        unit,
        interval,
        startDate: startDate ?? null,
        endDate: parsedEndDate,
        totalIn,
        totalOut,
      },
    });
  } catch (error) {
    next(error);
  }
};
