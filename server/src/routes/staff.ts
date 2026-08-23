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
import { NotFoundError } from '@/errors';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from Staff');

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

function uniqueUsername(username: string): Promise<string> {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM Staff WHERE username = $1', [username], (err, result) => {
      if (err) {
        reject(err);
      } else if (result.rows.length > 0) {
        // If username exists, append a random number and check again
        const newUsername = `${username}${Math.floor(Math.random() * 1000)}`;
        resolve(uniqueUsername(newUsername));
      } else {
        resolve(username);
      }
    });
  });
}

function checkFirstLastNameExists(firstName: string, lastName: string): Promise<boolean> { //should return boolean if first and last name exists in the database
  return new Promise((resolve, reject) => {
    pool.query('SELECT "firstName", "lastName" FROM Staff WHERE Staff."firstName" = $1 AND Staff."lastName" = $2', [firstName, lastName], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.rows.length > 0);
      }
    });
  });
}

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
      const isExisting = await checkFirstLastNameExists(parsed.firstName, parsed.lastName);
      if (isExisting) {
        throw new Error('A staff member with the same first and last name already exists.');
      }
      let username = await uniqueUsername(`${parsed.firstName.toLowerCase()[0]}${parsed.middleName?.toLowerCase()[0] || ''}${parsed.lastName.toLowerCase()}`);
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
      res.status(400).json({ error: (error as Error).message });
      console.error('Error creating staff member:');
      next(error);
    }
  },
);

export default router;
