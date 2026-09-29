import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import { createLguCaseQuery, getFinancialSummaryQuerySchema } from 'shared';
import { foldPeriods } from '@/util/financial';
import validate from '@/middleware/validate';
import { getDirect } from '@/controllers/financial/direct';
import { toExclusiveEndBound } from '@/util/date';
import { createLguCase, getLguCases } from '@/controllers/lgucase';

const router = Router();

/**
 * Sample URLs
 * `http://localhost:4000/financial/direct`
 *
 * `http://localhost:4000/financial/direct?search=Dela%20Cruz`
 *
 * `http://localhost:4000/financial/direct?search=Reyes&sortBy=totalamountpaid&sortOrder=desc`
 *
 * `http://localhost:4000/financial/direct?sortBy=totalamount&sortOrder=asc&page=1&limit=20`
 *
 * `http://localhost:4000/financial/direct?sortBy=representative_name&sortOrder=asc`
 *
 * `http://localhost:4000/financial/direct?sortBy=caseid&sortOrder=desc&page=2&limit=10`
 */
router.get('/direct', requireAuth, getDirect);

// TODO: Move out of financial/lgucases and into /lgucases
router.post(
  '/lgucases',
  requireAuth,
  validate(createLguCaseQuery),
  createLguCase,
);
/**
 * Sample URLs
 * `http://localhost:6543/financial/lgucases`
 * `http://localhost:6543/financial/lgucases?search=Juan`
 * `http://localhost:6543/financial/lgucases?search=Dela%20Cruz&sortBy=reimbursementamount&sortOrder=desc&page=1&limit=20`
 */
router.get('/lgucases', requireAuth, getLguCases);

/**
 * Sample URLs
 * `http://localhost:4000/financial/summary` (defaults: by month)
 *
 * `http://localhost:4000/financial/summary?unit=day`
 *
 * every 3 days
 * `http://localhost:4000/financial/summary?unit=day&interval=3`
 *
 * `http://localhost:4000/financial/summary?unit=week`
 *
 * every 6 months
 * `http://localhost:4000/financial/summary?unit=month&interval=6`
 *
 * every 5 years
 * `http://localhost:4000/financial/summary?unit=year&interval=5`
 *
 * `http://localhost:4000/financial/summary?caseid=12`
 *
 * `endDate` is treated as inclusive of the whole day when given without a time
 * `http://localhost:4000/financial/summary?startDate=2026-01-01&endDate=2026-12-31`
 */
router.get(
  '/summary',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
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
        result.rows,
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
  },
);

/**
 * Expenses Routes
 */
router.get(
  '/expenses',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      const params: any[] = [limit, offset];
      let whereClause = '';

      if (search) {
        whereClause = `WHERE description ILIKE $3`;
        params.push(`%${search}%`);
      }

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM public.expense ${whereClause}`,
        search ? [params[2]] : [],
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `
      SELECT * FROM public.expense
      ${whereClause}
      ORDER BY expensedate DESC
      LIMIT $1 OFFSET $2
    `,
        params,
      );

      res.json({
        data: result.rows,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/expenses',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { description, amount, recordedby } = req.body;
      const result = await pool.query(
        `
      INSERT INTO public.expense (description, amount, expensedate, recordedby)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *
    `,
        [description, amount, recordedby || 'Staff'],
      );

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
