import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import { getDirectPlansQuerySchema } from 'shared';

const SORT_COLUMNS: Record<string, string> = {
  caseid: 'dr.caseid',
  deceased_name: 'deceased_name',
  representativeid: 'dr.representedby',
  representative_name: 'representative_name',
  contractid: 'c.contractid',
  totalamount: 'c.totalamount',
  totalamountpaid: 'totalamountpaid',
};

export async function getDirect(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getDirectPlansQuerySchema.parse(req.query);

    const selectClause = `
      SELECT
        dr.caseid,
        CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
        dr.representedby AS representativeid,
        CONCAT_WS(' ', NULLIF(r.firstname, ''), NULLIF(r.middlename, ''), NULLIF(r.lastname, '')) AS representative_name,
        c.contractid,
        c.totalamount,
        COALESCE(t.totalpaid, 0) AS totalamountpaid
    `;

    const fromAndJoins = `
      FROM public.deceasedrecord dr
      LEFT JOIN public.representative r ON dr.representedby = r.representativeid
      LEFT JOIN public.contract c ON dr.caseid = c.caseid
      LEFT JOIN (
        SELECT
          caseid,
          COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory <> 'Refund'
          ), 0)
          - COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory = 'Refund'
          ), 0) AS totalpaid
        FROM public.transaction
        GROUP BY caseid
      ) t ON dr.caseid = t.caseid
    `;

    // Start building `whereClause`
    const whereConditions: string[] = [`dr.plantype = 'Direct'`];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: deceasedrecord.name, representative.name
      whereConditions.push(`(
        CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex} OR
        CONCAT_WS(' ', r.firstname, r.middlename, r.lastname) ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
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
}
