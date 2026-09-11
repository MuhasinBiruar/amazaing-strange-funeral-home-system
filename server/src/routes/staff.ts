import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import { auth } from '@/lib/auth';
import validate from '@/middleware/validate';
import requireAdmin from '@/middleware/require-admin';
import { ConflictError, NotFoundError } from '@/errors';
import { createStaffQuerySchema, type CreateStaffQuery } from 'shared';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Staff  ORDER BY CASE WHEN role = \'admin\' THEN 0 ELSE 1 END, "lastName"',
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:username', requireAuth, async (req, res, next) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT * FROM Staff WHERE username = $1', [
      username,
    ]);
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

async function uniqueUsername(username: string) {
  const result = await pool.query('SELECT * FROM Staff WHERE username = $1', [
    username,
  ]);

  if (result.rows.length > 0) {
    // If username exists, append a random number and check again
    const newUsername = `${username}${Math.floor(Math.random() * 1000)}`;
    return await uniqueUsername(newUsername);
  }

  return username;
}

async function checkFirstLastNameExists(firstName: string, lastName: string) {
  const result = await pool.query(
    'SELECT "firstName", "lastName" FROM Staff WHERE Staff."firstName" = $1 AND Staff."lastName" = $2',
    [firstName, lastName],
  );

  return result.rows.length > 0;
}

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(createStaffQuerySchema),
  async (
    req: Request<{}, {}, CreateStaffQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const isExisting = await checkFirstLastNameExists(
        parsed.firstName,
        parsed.lastName,
      );
      if (isExisting)
        throw new ConflictError(
          'A staff member with the same first and last name already exists.',
        );

      const username = await uniqueUsername(
        `${parsed.firstName.toLowerCase()[0]}${parsed.middleName?.toLowerCase()[0] || ''}${parsed.lastName.toLowerCase()}`,
      );
      const email = parsed.email ?? `${username}@staff.internal`;

      const staff = await auth.api.createUser({
        body: {
          email: email,
          password: parsed.password,
          name: `${parsed.firstName} ${parsed.lastName}`,
          role: parsed.role,
          data: {
            firstName: parsed.firstName,
            middleName: parsed.middleName,
            lastName: parsed.lastName,
            isActive: parsed.isActive,
            jobRole: parsed.jobRole || 'staff',
            contactNumber: parsed.contactNumber,
            username: username,
          },
        },
      });
      res.status(201).json({ data: staff });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
