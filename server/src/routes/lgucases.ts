import {
  createLguCase,
  getLguCases,
  updateLguCase,
} from '@/controllers/lgucase';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import { Router } from 'express';
import { createLguCaseQuery, updateLguCaseQuerySchema } from 'shared';
import { idParamSchema } from 'shared/utils';

const router = Router();

router.post('/', requireAuth, validate(createLguCaseQuery), createLguCase);
/**
 * Sample URLs
 * `http://localhost:6543/financial/lgucases`
 * `http://localhost:6543/financial/lgucases?search=Juan`
 * `http://localhost:6543/financial/lgucases?search=Dela%20Cruz&sortBy=reimbursementamount&sortOrder=desc&page=1&limit=20`
 */
router.get('/', requireAuth, getLguCases);
router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateLguCaseQuerySchema),
  updateLguCase,
);

export default router;
