import { Router } from 'express';
import requireAuth from '@/middleware/require-auth';
import {
  getDirectTransactions,
  getDirect,
} from '@/controllers/financial/direct';
import { getFinancialDetails } from '@/controllers/financial/details';
import { getFinancialSummary } from '@/controllers/financial/summary';

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
router.get('/direct/:id/transactions', requireAuth, getDirectTransactions);

/**
 * Sample URLs
 * `http://localhost:4000/financial/details?startDate=2026-01-01&endDate=2026-01-01`
 *
 * `http://localhost:4000/financial/details?startDate=2026-01-01&endDate=2026-01-31`
 */
router.get('/details', requireAuth, getFinancialDetails);

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

export default router;
