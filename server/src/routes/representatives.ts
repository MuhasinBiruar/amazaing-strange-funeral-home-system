import pool from '@/db';
import { BadRequestError, NotFoundError } from '@/errors';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import { joinName } from '@/util/audit-log';
import {
  createRepresentativeQuerySchema,
  Representative,
  updateRepresentativeQuerySchema,
  type CreateRepresentativeQuery,
  type UpdateRepresentativeQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from representative');

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
      'SELECT * FROM representative WHERE representativeid = $1',
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
  validate(createRepresentativeQuerySchema),
  async (
    req: Request<{}, {}, CreateRepresentativeQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
        INSERT INTO representative (
          firstname,
          middlename,
          lastname,
          relationship,
          contactnumber,
          address,
          datecreated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING representativeid;`,
        [
          parsed.firstname,
          parsed.middlename,
          parsed.lastname,
          parsed.relationship,
          parsed.contactnumber,
          parsed.address,
          parsed.datecreated,
        ],
      );

      const repName = joinName(
        parsed.firstname,
        parsed.middlename,
        parsed.lastname,
      );
      res.locals.auditAction = `${res.locals.session.user.name} added a new representative: ${repName}`;

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Partial update of a representative.
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateRepresentativeQuerySchema),
  async (
    req: Request<IdParam, {}, UpdateRepresentativeQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const parsed = req.body;

      if (Object.keys(parsed).length === 0)
        throw new BadRequestError('No fields provided for update.');

      const result = await pool.query<Representative>(
        `UPDATE representative SET
          firstname = COALESCE($1, firstname),
          middlename = COALESCE($2, middlename),
          lastname = COALESCE($3, lastname),
          relationship = COALESCE($4, relationship),
          contactnumber = COALESCE($5, contactnumber),
          address = COALESCE($6, address),
          datecreated = COALESCE($7, datecreated)
        WHERE representativeid = $8
        RETURNING *`,
        [
          parsed.firstname ?? null,
          parsed.middlename ?? null,
          parsed.lastname ?? null,
          parsed.relationship ?? null,
          parsed.contactnumber ?? null,
          parsed.address ?? null,
          parsed.datecreated ?? null,
          id,
        ],
      );

      if (result.rows.length === 0)
        throw new NotFoundError('Representative not found.');

      const updated = result.rows[0];
      const repName = joinName(
        updated.firstname,
        updated.middlename,
        updated.lastname,
      );
      res.locals.auditAction = `${res.locals.session.user.name} updated representative ${repName}`;

      res.json({
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM representative WHERE representativeid = $1 RETURNING *',
        [id],
      );

      if (result.rows.length === 0) {
        throw new NotFoundError();
      }

      const deleted = result.rows[0];
      const repName = joinName(
        deleted.firstname,
        deleted.middlename,
        deleted.lastname,
      );
      res.locals.auditAction = `${res.locals.session.user.name} deleted representative ${repName}`;

      res.json({
        data: deleted,
        message: 'Rollback successful: Representative deleted.',
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
