import { createLguCase, getLguCases } from '@/controllers/lgucase';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { Router } from 'express';
import { createLguCaseQuery } from 'shared';

const router = Router();

router.post('/', requireAuth, validate(createLguCaseQuery), createLguCase);
/**
 * Sample URLs
 * `http://localhost:6543/financial/lgucases`
 * `http://localhost:6543/financial/lgucases?search=Juan`
 * `http://localhost:6543/financial/lgucases?search=Dela%20Cruz&sortBy=reimbursementamount&sortOrder=desc&page=1&limit=20`
 */
router.get('/', requireAuth, getLguCases);

export default router;
