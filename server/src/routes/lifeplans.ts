import {
  createLifeplan,
  getLifeplans,
  getMyLifeplans,
} from '@/controllers/lifeplan';
import {
  createLifeplanCompany,
  getLifeplanCompany,
  getLifeplanCompanies,
  deleteLifeplanCompany,
} from '@/controllers/lifeplancompany';
import requireAuth, { requireLifeplanAgent } from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import { Router } from 'express';
import { createLifeplanQuery, createLifeplanCompanyQuerySchema } from 'shared';
import { idParamSchema } from 'shared/utils';

const router = Router();

router.post('/', requireAuth, validate(createLifeplanQuery), createLifeplan);
/**
 * Sample URLs
 * `http://localhost:4000/lifeplans`
 * `http://localhost:4000/lifeplans?search=Dela%20Cruz`
 * `http://localhost:4000/lifeplans?search=ABC%20Life&sortBy=totalamount&sortOrder=desc&page=1&limit=20`
 */
router.get('/', requireAuth, getLifeplans);

router.get('/mine', requireLifeplanAgent, getMyLifeplans);

router.post(
  '/companies',
  requireAuth,
  validate(createLifeplanCompanyQuerySchema),
  createLifeplanCompany,
);
router.get(
  '/companies/:id',
  requireAuth,
  validateParams(idParamSchema),
  getLifeplanCompany,
);
/**
 * Sample URLs
 * `http://localhost:4000/lifeplans/companies`
 * `http://localhost:4000/lifeplans/companies?search=Corporation`
 * `http://localhost:4000/lifeplans/companies?search=Company&sortBy=companyname&sortOrder=desc&page=1&limit=20`
 */
router.get('/companies', requireAuth, getLifeplanCompanies);
router.delete(
  '/companies/:id',
  requireAuth,
  validateParams(idParamSchema),
  deleteLifeplanCompany,
);

export default router;
