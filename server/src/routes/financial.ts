import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import {
  getDirectTransactions,
  getDirect,
  createDirectTransaction,
} from '@/controllers/financial/direct';
import { getFinancialDetails } from '@/controllers/financial/details';
import { getFinancialSummary } from '@/controllers/financial/summary';
import validate from '@/middleware/validate';
import { createTransactionQuerySchema } from 'shared';
import validateParams from '@/middleware/validate-params';
import { idParamSchema } from 'shared/utils';
import { getDayTransactions } from '@/controllers/financial/transactions';

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
router.get(
  '/direct/:id/transactions',
  requireAuth,
  validateParams(idParamSchema),
  getDirectTransactions,
);
router.post(
  '/direct/:id/transactions',
  requireAuth,
  validateParams(idParamSchema),
  validate(createTransactionQuerySchema),
  createDirectTransaction,
);

/**
 * Sample URLs
 * `http://localhost:4000/financial/details?startDate=2026-01-01&endDate=2026-01-01`
 *
 * `http://localhost:4000/financial/details?startDate=2026-01-01&endDate=2026-01-31`
 */
router.get('/details', requireAuth, getFinancialDetails);
router.get('/day-transactions', requireAuth, getDayTransactions);

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
router.get('/summary', requireAuth, getFinancialSummary);

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

      const params: (number | string)[] = [limit, offset];
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
