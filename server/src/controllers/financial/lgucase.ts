import pool from '@/db';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import { getLguCasesQuerySchema, type CreateLguCaseQuery } from 'shared';

const SORT_COLUMNS: Record<string, string> = {
  lgucaseid: 'lc.lgucaseid',
  reimbursementstatus: 'lc.reimbursementstatus',
  reimbursementamount: 'lc.reimbursementamount',
  caseid: 'lc.caseid',
  deceased_name: 'deceased_name',
};

export async function createLguCase(
  req: Request<{}, {}, CreateLguCaseQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = req.body;
    const result = await pool.query(
      `
        INSERT INTO lgucase (
          reimbursementstatus,
          reimbursementamount,
          caseid
        ) VALUES ($1, $2, $3) RETURNING lgucaseid;`,
      [parsed.reimbursementstatus, parsed.reimbursementamount, parsed.caseid],
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getLguCases(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getLguCasesQuerySchema.parse(req.query);

    const selectClause = `
        SELECT 
          lc.lgucaseid,
          lc.reimbursementstatus,
          lc.reimbursementamount,
          lc.caseid AS caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name
      `;

    const fromAndJoins = `
        FROM public.lgucase lc
        LEFT JOIN public.deceasedrecord dr ON lc.caseid = dr.caseid
      `;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: lgucase.caseid, lgucase.reimbursementstatus,
      // deceasedrecord.name
      whereConditions.push(`(
          lc.caseid::text ILIKE $${paramIndex} OR
          lc.reimbursementstatus::text ILIKE $${paramIndex} OR
          CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex}
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
            SELECT COUNT(lc.lgucaseid) as total
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
