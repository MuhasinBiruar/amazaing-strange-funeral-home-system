import pool from '@/db.ts';
import { NotFoundError } from '@/errors';
import requireAuth from '@/middleware/require-auth.ts';
import validate from '@/middleware/validate.ts';
import {
  burialrecordSchema,
  type BurialRecordSchema,
} from '@/schemas/burialrecord.ts';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from burialrecord');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM burialrecord WHERE burialid = $1',
      [id],
    );

    if (result.rows.length === 0) throw new NotFoundError();

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(burialrecordSchema),
  async (
    req: Request<{}, {}, BurialRecordSchema>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
        INSERT INTO burialrecord (
          burialdate,
          burialsite,
          caseid
        ) VALUES ($1, $2, $3) RETURNING burialid;`,
        [parsed.burialdate, parsed.burialsite, parsed.caseid],
      );

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
