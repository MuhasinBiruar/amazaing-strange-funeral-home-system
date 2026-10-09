import pool from '@/db';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { getDeceasedName } from '@/util/audit-log';
import type { NextFunction, Request, Response } from 'express';
import {
  getLguCasesQuerySchema,
  type CreateLguCaseQuery,
  type GetLguCasesResponse,
  type GetLguCasesRow,
  type UpdateLguCaseQuery,
} from 'shared';
import type { IdParam } from 'shared/utils';
import { BadRequestError, NotFoundError } from '@/errors';

const SORT_COLUMNS: Record<keyof GetLguCasesRow, string> = {
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

    const deceasedName = await getDeceasedName(parsed.caseid);
    res.locals.auditAction = `${res.locals.session.user.name} created an LGU case for ${deceasedName}`;

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
          client.query<GetLguCasesRow>(dataQuery, [
            ...queryParams,
            ...[limit, (page - 1) * limit],
          ]),
          client.query<{ total: string }>(countQuery, queryParams),
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
    } satisfies GetLguCasesResponse);
  } catch (error) {
    next(error);
  }
}

export async function updateLguCase(
  req: Request<IdParam, {}, UpdateLguCaseQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const parsed = req.body;

    if (Object.keys(parsed).length === 0)
      throw new BadRequestError('No fields provided for update.');

    const result = await pool.query(
      `UPDATE lgucase SET
        reimbursementstatus = COALESCE($1, reimbursementstatus),
        reimbursementamount = COALESCE($2, reimbursementamount)
      WHERE lgucaseid = $3
      RETURNING *`,
      [
        parsed.reimbursementstatus ?? null,
        parsed.reimbursementamount ?? null,
        id,
      ],
    );

    if (result.rows.length === 0)
      throw new NotFoundError('LGU case not found.');

    const updated = result.rows[0];
    const deceasedName = await getDeceasedName(updated.caseid);
    res.locals.auditAction = `${res.locals.session.user.name} updated the LGU case for ${deceasedName} (status: ${updated.reimbursementstatus}, amount: ${updated.reimbursementamount})`;

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
