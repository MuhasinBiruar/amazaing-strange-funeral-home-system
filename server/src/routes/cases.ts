import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { getCasesQuerySchema } from 'shared';
import requireAuth from '@/middleware/require-auth';
import { withRepeatableRead } from '@/util/with-repeatable-read';

const router = Router();

const SORT_COLUMNS: Record<string, string> = {
  caseid: 'dr.caseid',
  deceased_name: 'deceased_name',
  representative_name: 'representative_name',
  burialdatedeadline: 'c.burialdatedeadline',
  total_pending_docs: 'total_pending_docs',
  totalamount: 'c.totalamount',
  servicestatus: 'dr.servicestatus',
  datecreated: 'dr.datecreated',
  managed_by_name: 'managed_by_name',
};

/**
 * Sample URLs
 * `http://localhost:4000/cases`
 * `http://localhost:4000/cases?search=Juan`
 * `http://localhost:4000/cases?status=active`
 * `http://localhost:4000/cases?search=Dela%20Cruz&status=pending&sortBy=burialdatedeadline&sortOrder=asc&page=1&limit=20`
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, status, sortBy, sortOrder } =
        getCasesQuerySchema.parse(req.query);

      const selectClause = `
        SELECT 
        CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
        CONCAT_WS(' ', NULLIF(r.firstname, ''), NULLIF(r.middlename, ''), NULLIF(r.lastname, '')) AS representative_name,
        c.burialdatedeadline,
        COALESCE(d.pending_docs, 0)::int AS total_pending_docs,
        c.totalamount,
        dr.servicestatus,
        dr.datecreated,
        CONCAT_WS(' ', NULLIF(s."firstName", ''), NULLIF(s."middleName", ''), NULLIF(s."lastName", '')) AS managed_by_name,
        dr.caseid,
        c.contractid,
        r.representativeid,
        s.id AS staffid
      `;

      const fromAndJoins = `
        FROM public.deceasedrecord dr
        JOIN public.contract c ON dr.caseid = c.caseid
        LEFT JOIN public.representative r ON dr.representedby = r.representativeid
        LEFT JOIN public.staff s ON dr.managedby = s.id
        LEFT JOIN (
          SELECT caseid, COUNT(documentid) as pending_docs
          FROM public.document
          WHERE verificationstatus = 'pending'
          GROUP BY caseid
        ) d ON dr.caseid = d.caseid
      `;

      // Start building `whereClause`
      const whereConditions: string[] = [];
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

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';
      // Finish building `whereClause`

      const orderByClause = `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
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

export default router;
