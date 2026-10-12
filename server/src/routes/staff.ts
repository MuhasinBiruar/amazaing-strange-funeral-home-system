import { Router, type Request } from 'express';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import requireAdmin from '@/middleware/require-admin';
import { createStaffQuerySchema, updateStaffQuerySchema } from 'shared';
import { createStaff, getStaff, updateStaff } from '@/controllers/staff';
import * as StaffModel from '@/model/staff';

const router = Router();

/**
 * Sample URLs
 * `http://localhost:4000/staff`
 * `http://localhost:4000/staff?search=Juan`
 * `http://localhost:4000/staff?isActive=true`
 * `http://localhost:4000/staff?sortBy=access&sortOrder=desc&page=1&limit=20`
 */
router.get('/', requireAuth, getStaff);

router.get(
  '/:id',
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    try {
      res.json({ data: await StaffModel.getStaffDetail(req.params.id) });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(createStaffQuerySchema),
  createStaff,
);

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateStaffQuerySchema),
  updateStaff,
);

export default router;
