import { Router } from 'express';
import {
  createCasketInventoryQuerySchema,
  updateCasketInventoryQuerySchema,
} from 'shared';
import { idParamSchema } from 'shared/utils';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import {
  createCasketInventory,
  getCasketInventory,
  getPackagesOfCasket,
  getPaginatedCasketInventory,
  updateCasketInventory,
  getDeliveryHistoryOfCasket,
  deleteCasketInventory,
} from '@/controllers/casketinventory';

const router = Router();

router.get('/', requireAuth, getCasketInventory);

router.get('/paginated', requireAuth, getPaginatedCasketInventory);

router.post(
  '/',
  requireAuth,
  validate(createCasketInventoryQuerySchema),
  createCasketInventory,
);

router.get(
  '/:id/packages',
  requireAuth,
  validateParams(idParamSchema),
  getPackagesOfCasket,
);

router.get(
  '/:id/deliveryhistory',
  requireAuth,
  validateParams(idParamSchema),
  getDeliveryHistoryOfCasket,
);

router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateCasketInventoryQuerySchema),
  updateCasketInventory,
);

router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  deleteCasketInventory,
);

export default router;
