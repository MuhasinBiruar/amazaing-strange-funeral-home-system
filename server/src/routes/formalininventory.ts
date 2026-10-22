import { Router } from 'express';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { createFormalinUsageSchema } from 'shared';
import { getFormalinInventory } from '@/controllers/formalininventory';
import {
  createFormalinUsage,
  getFormalinUsage,
  getFormalinUsageBreakdown,
  getFormalinUsageSummary,
} from '@/controllers/formalinusage';

const router = Router();

router.get('/', requireAuth, getFormalinInventory);

router.post(
  '/usage',
  requireAuth,
  validate(createFormalinUsageSchema),
  createFormalinUsage,
);

router.get('/usage', requireAuth, getFormalinUsage);

router.get('/usage/summary', requireAuth, getFormalinUsageSummary);

router.get('/usage/breakdown', requireAuth, getFormalinUsageBreakdown);

export default router;
