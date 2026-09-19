import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import {
  createLguCaseQuery,
  createLifeplanCompanyQuerySchema,
  createLifeplanQuery,
  getFinancialSummaryQuerySchema,
} from 'shared';
import { foldPeriods } from '@/util/financial';
import validate from '@/middleware/validate';
import {
  createLguCase,
  getLguCases,
  createLifeplan,
  getLifeplan,
  getDirect,
  getCaseTransactions,
  createLifeplanCompany,
  getLifeplanCompanies,
  getLifeplanCompany,
  deleteLifeplanCompany,
} from '@/controllers/financial';
import { idParamSchema } from 'shared/utils';
import validateParams from '@/middleware/validate-params';
import { toExclusiveEndBound } from '@/util/date';
import {
  getDayTransactions,
  createCaseTransaction,
} from '@/controllers/financial';
import { createTransactionSchema } from 'shared';
import { createExpenseSchema } from 'shared';
import { getExpenses, createExpense } from '@/controllers/financial';

const router = Router();

router.post(
  '/direct/:id/transactions',
  requireAuth,
  validateParams(idParamSchema),
  validate(createTransactionSchema),
  createCaseTransaction,
);


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

/**
 * Sample URL
 * `http://localhost:4000/financial/direct/12/transactions`
 */
router.get(
  '/direct/:id/transactions',
  requireAuth,
  validateParams(idParamSchema),
  getCaseTransactions,
);

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

router.post(
  '/lifeplans',
  requireAuth,
  validate(createLifeplanQuery),
  createLifeplan,
);
/**
 * Sample URLs
 * `http://localhost:4000/financial/lifeplans`
 * `http://localhost:4000/financial/lifeplans?search=Dela%20Cruz`
 * `http://localhost:4000/financial/lifeplans?search=ABC%20Life&sortBy=totalamount&sortOrder=desc&page=1&limit=20`
 */
router.get('/lifeplans', requireAuth, getLifeplan);

router.post(
  '/lifeplans/companies',
  requireAuth,
  validate(createLifeplanCompanyQuerySchema),
  createLifeplanCompany,
);
router.get(
  '/lifeplans/companies/:id',
  requireAuth,
  validateParams(idParamSchema),
  getLifeplanCompany,
);
/**
 * Sample URLs
 * `http://localhost:4000/financial/lifeplans/companies`
 * `http://localhost:4000/financial/lifeplans/companies?search=Corporation`
 * `http://localhost:4000/financial/lifeplans/companies?search=Company&sortBy=companyname&sortOrder=desc&page=1&limit=20`
 */
router.get('/lifeplans/companies', requireAuth, getLifeplanCompanies);
router.delete(
  '/lifeplans/companies/:id',
  requireAuth,
  validateParams(idParamSchema),
  deleteLifeplanCompany,
);

/**
 * Sample URL
 * `http://localhost:4000/financial/transactions?startDate=2026-08-01&endDate=2026-08-01`
 */
router.get('/transactions', requireAuth, getDayTransactions);

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
        // Deliveries and Expenses do not have a caseid column, so this filter
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
            date_trunc('${unit}', expensedate::timestamp) AS period,
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

router.get('/expenses', requireAuth, getExpenses);

router.post(
  '/expenses',
  requireAuth,
  validate(createExpenseSchema),
  createExpense
);


export default router;
