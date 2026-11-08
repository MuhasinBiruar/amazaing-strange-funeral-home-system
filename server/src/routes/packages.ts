import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import validate from '@/middleware/validate';
import requireAuth from '@/middleware/require-auth';
import { ConflictError, NotFoundError } from '@/errors';
import {
  createPackageQuerySchema,
  updatePackageQuerySchema,
  type CreatePackageQuery,
  type UpdatePackageQuery,
} from 'shared';

const router = Router();

const SELECT_WITH_CASKET = `
  SELECT
    p.*,
    ci.caskettype,
    ci.currentstock AS casket_currentstock
  FROM package p
  LEFT JOIN casketinventory ci ON p.casketid = ci.casketid
`;

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(SELECT_WITH_CASKET);

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
      `${SELECT_WITH_CASKET} WHERE p.packageid = $1`,
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
          inclusions,
          casketid
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING packageid;`,
        [
          parsed.packagename,
          parsed.packagetype,
          parsed.price,
          parsed.embalmingperiod,
          parsed.inclusions,
          parsed.casketid,
        ],
      );

      res.locals.auditAction = `${res.locals.session.user.name} created a new package: ${parsed.packagename} (${parsed.packagetype})`;

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  validate(updatePackageQuerySchema),
  async (
    req: Request<{ id: string }, {}, UpdatePackageQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const fields = Object.entries(req.body);
      if (fields.length === 0) throw new ConflictError('No changes provided.');
      const values = fields.map(([, value]) => value);
      const setClause = fields
        .map(([key], index) => `"${key}" = $${index + 1}`)
        .join(', ');
      const result = await pool.query(
        `UPDATE package SET ${setClause} WHERE packageid = $${fields.length + 1}
         RETURNING packageid`,
        [...values, req.params.id],
      );
      if (result.rows.length === 0) throw new NotFoundError();

      res.locals.auditAction = `${res.locals.session.user.name} updated package ${req.params.id}`;
      const updated = await pool.query(
        `${SELECT_WITH_CASKET} WHERE p.packageid = $1`,
        [req.params.id],
      );
      res.json({ data: updated.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
