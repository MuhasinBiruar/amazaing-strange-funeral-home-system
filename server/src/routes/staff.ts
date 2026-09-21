import { Router, type Request } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import requireAdmin from '@/middleware/require-admin';
import { NotFoundError } from '@/errors';
import {
  accessPageEnum,
  createStaffQuerySchema,
  updateStaffQuerySchema,
} from 'shared';
import { createStaff, getStaff, updateStaff } from '@/controllers/staff';

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
      const { id } = req.params;

      const result = await pool.query(
        `SELECT s.*, ${accessPageEnum.options.map((k) => `a.${k}`).join(', ')}
          FROM public.staff s
          LEFT JOIN public.access a ON a.staffid = s.id
          WHERE s.id = $1`,
        [id],
      );
      if (result.rows.length === 0) throw new NotFoundError();

      // If access page does not exist, assume false.
      const row = result.rows[0];
      const access = Object.fromEntries(
        accessPageEnum.options.map((key) => [key, row[key] ?? false]),
      );

      res.json({ data: { ...row, access } });
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
