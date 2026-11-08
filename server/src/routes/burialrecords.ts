import pool from '@/db';
import { ConflictError, NotFoundError } from '@/errors';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { getDeceasedName } from '@/util/audit-log';
import { toExclusiveEndBound } from '@/util/date';
import {
  createBurialRecordQuerySchema,
  getBurialRecordsQuerySchema,
  updateBurialRecordQuerySchema,
  type CreateBurialRecordQuery,
  type UpdateBurialRecordQuery,
} from 'shared';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const router = Router();

const SORT_COLUMNS = {
  burialdate: 'c.burialdatedeadline',
  burialsite: 'br.burialsite',
  deceased_name: 'deceased_name',
  caseid: 'br.caseid',
} as const;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      status,
      plantype,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } =
      getBurialRecordsQuerySchema.parse(req.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (search) {
      conditions.push(`(
        br.caseid::text ILIKE $1 OR
        br.burialsite ILIKE $1 OR
        CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $1
      )`);
      params.push(`%${search}%`);
    }
    if (status) {
      conditions.push(`dr.servicestatus = $${params.length + 1}`);
      params.push(status);
    }
    if (plantype) {
      conditions.push(`dr.plantype = $${params.length + 1}`);
      params.push(plantype);
    }
    if (startDate) {
      conditions.push(`c.burialdatedeadline >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`c.burialdatedeadline < $${params.length + 1}`);
      params.push(toExclusiveEndBound(endDate));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offsetIndex = params.length + 1;
    const from = `
      FROM burialrecord br
      JOIN deceasedrecord dr ON dr.caseid = br.caseid
      LEFT JOIN contract c ON c.caseid = br.caseid
    `;
    const order = `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`;
    const result = await pool.query(
      `      SELECT br.burialid, c.burialdatedeadline AS burialdate, br.burialsite, br.caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
          dr.servicestatus, dr.plantype
       ${from} ${where} ${order}
       LIMIT $${offsetIndex} OFFSET $${offsetIndex + 1}`,
      [...params, limit, (page - 1) * limit],
    );
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total ${from} ${where}`,
      params,
    );
    const total = count.rows[0].total;

    res.json({
      data: result.rows,
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
  validate(createBurialRecordQuerySchema),
  async (
    req: Request<{}, {}, CreateBurialRecordQuery>,
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
      if (parsed.burialdate !== null) {
        await pool.query(
          'UPDATE contract SET burialdatedeadline = $1 WHERE caseid = $2',
          [parsed.burialdate, parsed.caseid],
        );
      }

      const deceasedName = await getDeceasedName(parsed.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} added a burial record for ${deceasedName}`;

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
  validate(updateBurialRecordQuerySchema),
  async (
    req: Request<{ id: string }, {}, UpdateBurialRecordQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { burialdate, burialsite } = req.body;
      if (burialdate === undefined && burialsite === undefined)
        throw new ConflictError('No changes provided.');

      const result = await pool.query(
        `UPDATE burialrecord br
         SET burialsite = CASE WHEN $1 THEN $2 ELSE br.burialsite END
         WHERE br.burialid = $3
         RETURNING br.burialid, br.caseid`,
        [burialsite !== undefined, burialsite, req.params.id],
      );
      if (result.rows.length === 0) throw new NotFoundError();

      const { caseid } = result.rows[0];
      if (burialdate !== undefined) {
        await pool.query(
          'UPDATE contract SET burialdatedeadline = $1 WHERE caseid = $2',
          [burialdate, caseid],
        );
      }

      res.locals.auditAction = `${res.locals.session.user.name} updated burial record ${req.params.id}`;
      const updated = await pool.query(
        `SELECT br.burialid, c.burialdatedeadline AS burialdate, br.burialsite,
            br.caseid,
            CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
            dr.servicestatus, dr.plantype
         FROM burialrecord br
         JOIN deceasedrecord dr ON dr.caseid = br.caseid
         LEFT JOIN contract c ON c.caseid = br.caseid
         WHERE br.burialid = $1`,
        [req.params.id],
      );
      res.json({ data: updated.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
