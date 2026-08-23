import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import validate from '@/middleware/validate.ts';
import requireAuth from '@/middleware/require-auth.ts';
import { NotFoundError } from '@/errors';
import { packageSchema, type PackageSchema } from '@/schemas/package.ts';

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
  validate(packageSchema),
  async (
    req: Request<{}, {}, PackageSchema>,
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
    } catch (error: any) {
      next(error);
    }
  },
);

export default router;
