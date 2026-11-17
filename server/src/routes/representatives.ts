import pool from '@/db';
import { BadRequestError, NotFoundError } from '@/errors';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import { joinName } from '@/util/audit-log';
import { toExclusiveEndBound } from '@/util/date';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import {
  createRepresentativeQuerySchema,
  getRepresentativesQuerySchema,
  type GetRepresentativesQuery,
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

const SORT_COLUMNS: Record<GetRepresentativesQuery['sortBy'], string> = {
  lastname: 'r.lastname',
  firstname: 'r.firstname',
  middlename: 'r.middlename',
  datecreated: 'r.datecreated',
  case_count: 'case_count',
};

/**
 * Paginated representatives with how many cases each represents, for picking
 * an existing representative at intake.
 *
 * Sample URLs
 * `http://localhost:4000/representatives?search=Santos`
 * `http://localhost:4000/representatives?startDate=2026-06-01&endDate=2026-06-30&sortBy=datecreated&sortOrder=desc`
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, search, startDate, endDate, sortBy, sortOrder } =
      getRepresentativesQuerySchema.parse(req.query);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        CONCAT_WS(' ', r.firstname, r.middlename, r.lastname) ILIKE $${params.length} OR
        CONCAT_WS(' ', r.lastname, r.firstname, r.middlename) ILIKE $${params.length} OR
        r.contactnumber ILIKE $${params.length}
      )`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`r.datecreated >= $${params.length}`);
    }
    if (endDate) {
      params.push(toExclusiveEndBound(endDate));
      conditions.push(`r.datecreated < $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const [dataResult, countResult] = await withRepeatableRead((client) =>
      Promise.all([
        client.query(
          `SELECT r.*, COUNT(dr.caseid)::int AS case_count
           FROM representative r
           LEFT JOIN deceasedrecord dr ON dr.representedby = r.representativeid
           ${where}
           GROUP BY r.representativeid
           ORDER BY ${SORT_COLUMNS[sortBy]} ${direction} NULLS LAST,
             r.lastname, r.firstname, r.representativeid
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, (page - 1) * limit],
        ),
        client.query<{ total: number }>(
          `SELECT COUNT(*)::int AS total FROM representative r ${where}`,
          params,
        ),
      ]),
    );

    const total = countResult.rows[0].total;
    res.json({
      data: dataResult.rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
      const result = await pool.query<Representative>(
        `
        INSERT INTO representative (
          firstname,
          middlename,
          lastname,
          relationship,
          contactnumber,
          address,
          datecreated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
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
          middlename = CASE WHEN $9::boolean THEN $2 ELSE middlename END,
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
          // Middle name is optional, so an explicit null/blank clears it;
          // leaving the key out keeps the current value.
          'middlename' in parsed,
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
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
