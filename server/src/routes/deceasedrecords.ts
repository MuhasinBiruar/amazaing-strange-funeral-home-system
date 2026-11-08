import { Router } from 'express';
import validate from '@/middleware/validate';
import requireAuth from '@/middleware/require-auth';
import {
  createDeceasedRecordQuerySchema,
  updateCasePlanQuerySchema,
  updateDeceasedRecordQuerySchema,
} from 'shared';
import { getCasePlan, updateCasePlan } from '@/controllers/caseplan';
import validateParams from '@/middleware/validate-params';
import { idParamSchema } from 'shared/utils';
import { getUncontractedDeceased } from '@/controllers/uncontracteddeceased';
import {
  createDeceasedRecord,
  deleteDeceasedRecord,
  getDeceasedRecordById,
  updateDeceasedRecord,
} from '@/controllers/deceasedrecords';

const router = Router();

/**
 * Sample URLs
 * `http://localhost:4000/deceasedrecords/without-contract`
 * `http://localhost:4000/deceasedrecords/without-contract?search=Juan`
 * `http://localhost:4000/deceasedrecords/without-contract?status=intake&sortBy=datecreated&sortOrder=desc&page=1&limit=20`
 */
router.get('/without-contract', requireAuth, getUncontractedDeceased);

router.get(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  getDeceasedRecordById,
);

router.post(
  '/',
  requireAuth,
  validate(createDeceasedRecordQuerySchema),
  createDeceasedRecord,
);

router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateDeceasedRecordQuerySchema),
  updateDeceasedRecord,
);

router.get(
  '/:id/plan',
  requireAuth,
  validateParams(idParamSchema),
  getCasePlan,
);

router.patch(
  '/:id/plan',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateCasePlanQuerySchema),
  updateCasePlan,
);

router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  deleteDeceasedRecord,
);

export default router;
