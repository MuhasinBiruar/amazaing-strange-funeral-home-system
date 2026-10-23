import { createLgu, getLgus } from '@/controllers/lgu';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { Router } from 'express';
import { createLguQuerySchema } from 'shared';

const router = Router();

router.post('/', requireAuth, validate(createLguQuerySchema), createLgu);
/**
 * Sample URLs
 * `http://localhost:4000/lgus`
 * `http://localhost:4000/lgus?search=Quezon`
 * `http://localhost:4000/lgus?startDate=2026-01-01&endDate=2026-12-31&sortBy=total_serviced_amount&sortOrder=desc`
 */
router.get('/', requireAuth, getLgus);

export default router;
