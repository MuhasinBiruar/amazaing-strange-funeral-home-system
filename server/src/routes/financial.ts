import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import { getFinancialSummaryQuerySchema } from 'shared';
import foldPeriods from '@/util/fold-periods';

const router = Router();

/**
 * Sample URLs
 * `http://localhost:4000/financial/summary` (defaults: by month)
 * `http://localhost:4000/financial/summary?unit=day`
 * `http://localhost:4000/financial/summary?unit=day&interval=3` (every 3 days)
 * `http://localhost:4000/financial/summary?unit=week`
 * `http://localhost:4000/financial/summary?unit=month&interval=6` (every 6 months)
 * `http://localhost:4000/financial/summary?unit=year&interval=5` (every 5 years)
 * `http://localhost:4000/financial/summary?caseid=12`
 * `http://localhost:4000/financial/summary?startDate=2026-01-01&endDate=2026-12-31`
 */
router.get(
  '/summary',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unit, interval, startDate, endDate, caseid } =
        getFinancialSummaryQuerySchema.parse(req.query);

      const whereConditions: string[] = [`transactionstatus = 'completed'`];
      const queryParams: unknown[] = [];
      let paramIndex = whereConditions.length;

      if (startDate) {
        whereConditions.push(`paymentdatetime >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`paymentdatetime < $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }

      if (caseid !== undefined) {
        whereConditions.push(`caseid = $${paramIndex}`);
        queryParams.push(caseid);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const result = await pool.query(
        `
        SELECT
          date_trunc('${unit}', paymentdatetime) AS period,
          COALESCE(SUM(amount) FILTER (
            WHERE paymentcategory = 'Refund'
          ), 0) AS totalout,
          COALESCE(SUM(amount) FILTER (
            WHERE NOT (paymentcategory = 'Refund')
          ), 0) AS totalin,
          COUNT(*) AS transactioncount
        FROM public.transaction
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC;
        `,
        queryParams,
      );

      const { buckets, totalIn, totalOut } = foldPeriods(
        result.rows,
        unit,
        interval,
        startDate ?? null,
      );

      res.json({
        data: buckets,
        meta: {
          unit,
          interval,
          startDate: startDate ?? null,
          endDate: endDate ?? null,
          totalIn,
          totalOut,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
