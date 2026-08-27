import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import requireAuth from '@/middleware/require-auth.ts';
import { contractSchema, type Contract } from 'shared';
import { NotFoundError } from '@/errors/http-errors.ts';
import validate from '@/middleware/validate.ts';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from contract');

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
      'SELECT * FROM contract WHERE contractid = $1',
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
  validate(contractSchema),
  async (req: Request<{}, {}, Contract>, res: Response, next: NextFunction) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
        INSERT INTO contract (
          signeddate,
          burialdatedeadline,
          totalamount,
          embalmingperiod,
          inclusions,
          caseid,
          packageid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING contractid;`,
        [
          parsed.signeddate,
          parsed.burialdatedeadline,
          parsed.totalamount,
          parsed.embalmingperiod,
          parsed.inclusions,
          parsed.caseid,
          parsed.packageid,
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
