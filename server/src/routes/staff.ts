import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import requireAuth from '@/middleware/require-auth.ts';
import { auth } from '@/lib/auth.ts';
import validate from '@/middleware/validate.ts';
import { staffSchema, type StaffSchemaType } from '@/schemas/staff.ts';
import requireAdmin from '@/middleware/require-admin.ts';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from Staff');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching staff members:');
    next(error);
  }
});

router.get('/:username', requireAuth, async (req, res, next) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT * FROM Staff WHERE username = $1', [
      username,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Staff member not found' });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching staff member:');
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(staffSchema),
  async (
    req: Request<{}, {}, StaffSchemaType>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const staff = await auth.api.createUser({
        body: {
          email: parsed.email,
          password: parsed.password,
          name: `${parsed.firstName} ${parsed.lastName}`,
          role: parsed.role,
          data: {
            firstName: parsed.firstName,
            middleName: parsed.middleName,
            lastName: parsed.lastName,
            jobRole: parsed.jobRole,
            contactNumber: parsed.contactNumber,
            username: `${parsed.firstName.toLowerCase()[0]}${parsed.middleName?.toLowerCase()[0] || ''}${parsed.lastName.toLowerCase()}`,
          },
        },
      });
      res.status(201).json({ data: staff });
    } catch (error) {
      console.error('Error creating staff member:');
      next(error);
    }
  },
);

export default router;
