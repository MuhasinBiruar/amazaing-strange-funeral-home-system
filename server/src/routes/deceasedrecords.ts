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
import { withRepeatableRead } from '@/util/with-repeatable-read';
import {
  createDeceasedRecordQuerySchema,
  getUncontractedDeceasedQuerySchema,
  deceasedrecordPatchSchema,
  // type CreateDeceasedRecordQuery,
  type UncontractedDeceased,
  type DeceasedRecordSchema,
} from 'shared';

const router = Router();

const UNCONTRACTED_SORT_COLUMNS: Record<keyof UncontractedDeceased, string> = {
  caseid: 'dr.caseid',
  deceased_name: 'deceased_name',
  representative_name: 'representative_name',
  representative_contact: 'r.contactnumber',
  causeofdeath: 'dr.causeofdeath',
  typeofdeath: 'dr.typeofdeath',
  physicaldescription: 'dr.physicaldescription',
  servicestatus: 'dr.servicestatus',
  hasmaturedlifeplan: 'dr.hasmaturedlifeplan',
  plantype: 'dr.plantype',
  datecreated: 'dr.datecreated',
  managed_by_name: 'managed_by_name',
};

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from DeceasedRecord');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Deceased records that do not have a contract yet — the candidates for a new
 * contract. This is the complement of `GET /cases`, which inner-joins
 * `contract` and so only ever returns records that already have one.
 *
 * @remarks
 * Must stay registered *above* `GET /:id`. Express matches routes in order, so
 * declared after it, `without-contract` is captured as an `:id` and the
 * `caseid = $1` lookup fails on integer parsing.
 *
 * Sample URLs
 * `http://localhost:4000/deceasedrecords/without-contract`
 * `http://localhost:4000/deceasedrecords/without-contract?search=Juan`
 * `http://localhost:4000/deceasedrecords/without-contract?status=intake&sortBy=datecreated&sortOrder=desc&page=1&limit=20`
 */
router.get(
  '/without-contract',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, status, sortBy, sortOrder } =
        getUncontractedDeceasedQuerySchema.parse(req.query);

      const selectClause = `
        SELECT
        dr.caseid,
        CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
        CONCAT_WS(' ', NULLIF(r.firstname, ''), NULLIF(r.middlename, ''), NULLIF(r.lastname, '')) AS representative_name,
        r.contactnumber AS representative_contact,
        dr.causeofdeath,
        dr.typeofdeath,
        dr.physicaldescription,
        dr.servicestatus,
        dr.hasmaturedlifeplan,
        dr.plantype,
        dr.datecreated,
        CONCAT_WS(' ', NULLIF(s."firstName", ''), NULLIF(s."middleName", ''), NULLIF(s."lastName", '')) AS managed_by_name
      `;

      const fromAndJoins = `
        FROM public.deceasedrecord dr
        LEFT JOIN public.contract c ON dr.caseid = c.caseid
        LEFT JOIN public.representative r ON dr.representedby = r.representativeid
        LEFT JOIN public.staff s ON dr.managedby = s.id
`;

      // Start building `whereClause`. The contract check is the whole point of
      // this endpoint, so it is always applied.
      const whereConditions: string[] = ['c.contractid IS NULL'];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      if (status) {
        whereConditions.push(`dr.servicestatus = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (search) {
        // Searches through: deceasedrec.caseid, deceasedrec.name,
        // rep.name, staff.name
        whereConditions.push(`(
          dr.caseid::text ILIKE $${paramIndex} OR
          CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex} OR
          CONCAT_WS(' ', r.firstname, r.middlename, r.lastname) ILIKE $${paramIndex} OR
          CONCAT_WS(' ', s."firstName", s."middleName", s."lastName") ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      // Finish building `whereClause`

      const orderByClause = `ORDER BY ${UNCONTRACTED_SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
      const paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const [dataResult, countResult] = await withRepeatableRead(
        async (client) => {
          const dataQuery = `
            ${selectClause}
            ${fromAndJoins}
            ${whereClause}
            ${orderByClause}
            ${paginationClause}
          `;

          const countQuery = `
            SELECT COUNT(dr.caseid) as total
            ${fromAndJoins}
            ${whereClause}
          `;

          return await Promise.all([
            client.query(dataQuery, [
              ...queryParams,
              ...[limit, (page - 1) * limit],
            ]),
            client.query(countQuery, queryParams),
          ]);
        },
      );

      const totalRecords = parseInt(countResult.rows[0].total, 10);
      res.json({
        data: dataResult.rows,
        meta: {
          total: totalRecords,
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM DeceasedRecord WHERE caseid = $1',
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
  validate(createDeceasedRecordQuerySchema),
  async (
    req: Request<{}, {}, DeceasedRecordSchema>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const managedby = res.locals.session.user.id;
      const result = await pool.query(
        `
        INSERT INTO deceasedrecord (
          firstname,
          middlename,
          lastname,
          causeofdeath,
          typeofdeath,
          physicaldescription,
          servicestatus,
          hasmaturedlifeplan,
          plantype,
          datecreated,
          dateofdeath,
          managedby,
          representedby
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING caseid;`,
        [
          parsed.firstname,
          parsed.middlename,
          parsed.lastname,
          parsed.causeofdeath,
          parsed.typeofdeath,
          parsed.physicaldescription,
          parsed.servicestatus,
          parsed.hasmaturedlifeplan,
          parsed.plantype,
          parsed.datecreated,
          parsed.dateofdeath,
          managedby,
          parsed.representedby,
        ],
      );

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      // Fixed: Removed `: any`
      next(error);
    }
  },
);

router.patch(
  '/:id',
  requireAuth,
  validate(deceasedrecordPatchSchema),
  async (
    req: Request<{ id: string }, {}, Partial<DeceasedRecordSchema>>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const parsed = req.body;
      const userId = res.locals.session.user.id;

      if (Object.keys(parsed).length === 0) {
        return res
          .status(400)
          .json({ error: 'No fields provided for update.' });
      }

      const result = await pool.query(
        `UPDATE DeceasedRecord SET
          firstname = COALESCE($1, firstname),
          middlename = COALESCE($2, middlename),
          lastname = COALESCE($3, lastname),
          causeofdeath = COALESCE($4, causeofdeath),
          typeofdeath = COALESCE($5, typeofdeath),
          physicaldescription = COALESCE($6, physicaldescription),
          servicestatus = COALESCE($7, servicestatus),
          hasmaturedlifeplan = COALESCE($8, hasmaturedlifeplan),
          plantype = COALESCE($9, plantype),
          datecreated = COALESCE($10, datecreated),
          dateofdeath = COALESCE($11, dateofdeath),
          representedby = COALESCE($12, representedby)
        WHERE caseid = $13 AND managedby = $14
        RETURNING *`,
        [
          parsed.firstname ?? null,
          parsed.middlename ?? null,
          parsed.lastname ?? null,
          parsed.causeofdeath ?? null,
          parsed.typeofdeath ?? null,
          parsed.physicaldescription ?? null,
          parsed.servicestatus ?? null,
          parsed.hasmaturedlifeplan ?? null,
          parsed.plantype ?? null,
          parsed.datecreated ?? null,
          parsed.dateofdeath ?? null,
          parsed.representedby ?? null,
          id,
          userId,
        ],
      );

      if (result.rows.length === 0) throw new NotFoundError();

      res.json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
