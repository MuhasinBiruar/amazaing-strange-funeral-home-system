import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import validate from '@/middleware/validate';
import requireAuth from '@/middleware/require-auth';
import { NotFoundError } from '@/errors';
import { createPackageQuerySchema, type CreatePackageQuery } from 'shared';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from package');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM package WHERE packageid = $1',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(createPackageQuerySchema),
  async (
    req: Request<{}, {}, CreatePackageQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
        INSERT INTO package (
          packagename,
          packagetype,
          price,
          embalmingperiod,
          inclusions
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING packageid;`,
        [
          parsed.packagename,
          parsed.packagetype,
          parsed.price,
          parsed.embalmingperiod,
          parsed.inclusions,
        ],
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
