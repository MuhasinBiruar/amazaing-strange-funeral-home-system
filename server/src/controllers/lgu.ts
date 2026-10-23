import pool from '@/db';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { Request, Response, NextFunction } from 'express';
import {
  getLgusQuerySchema,
  type CreateLguQuery,
  type GetLgusResponse,
  type LguAggregate,
} from 'shared';

const SORT_COLUMNS: Record<keyof LguAggregate, string> = {
  lguid: 'l.lguid',
  lguname: 'l.lguname',
  contactinfo: 'l.contactinfo',
  totalrecords: 'totalrecords',
  total_serviced_amount: 'total_serviced_amount',
};

export async function createLgu(
  req: Request<{}, {}, CreateLguQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = req.body;
    const result = await pool.query(
      `
        INSERT INTO lgu (
          lguname,
          contactinfo
        ) VALUES ($1, $2) RETURNING *;`,
      [parsed.lguname, parsed.contactinfo],
    );
    res.locals.auditAction = `${res.locals.session.user.name} added the LGU ${parsed.lguname}.`;

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns a paginated summary of LGUs, the LGU counterpart of
 * `getLifeplanCompanies`.
 *
 * Each LGU includes the number of associated LGU cases and their total
 * serviced (reimbursement) amount. Rejected reimbursements still count as a
 * record but not toward the amount, since the LGU won't pay them. When a date
 * range is supplied, those aggregates are calculated from cases created
 * within the inclusive calendar range using `deceasedrecord.datecreated`.
 * LGUs without matching cases remain in the response with zero aggregate
 * values.
 *
 * @param req Express request containing pagination, search, sorting, and date
 * range query parameters.
 * @param res Express response used to return LGU summaries and pagination
 * metadata.
 * @param next Express error handler callback.
 */
export async function getLgus(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, startDate, endDate, sortBy, sortOrder } =
      getLgusQuerySchema.parse(req.query);

    const fromAndJoins = `
      FROM public.lgu l
      LEFT JOIN public.lgucase lc
        ON l.lguid = lc.lguid
      LEFT JOIN public.deceasedrecord dr
        ON lc.caseid = dr.caseid
    `;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: lgu.lguname
      whereConditions.push(`l.lguname ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const countQueryParams = [...queryParams];
    const aggregateDateConditions: string[] = [];
    if (startDate) {
      aggregateDateConditions.push(`dr.datecreated >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      aggregateDateConditions.push(
        `dr.datecreated < ($${paramIndex}::date + INTERVAL '1 day')`,
      );
      queryParams.push(endDate);
      paramIndex++;
    }

    const recordFilter =
      aggregateDateConditions.length > 0
        ? `FILTER (WHERE ${aggregateDateConditions.join(' AND ')})`
        : '';
    const amountFilter = `FILTER (WHERE ${[
      `lc.reimbursementstatus <> 'rejected'`,
      ...aggregateDateConditions,
    ].join(' AND ')})`;

    const selectClause = `
      SELECT
        l.lguid,
        l.lguname,
        l.contactinfo,
        COUNT(lc.lgucaseid) ${recordFilter}::int AS totalrecords,
        COALESCE(SUM(lc.reimbursementamount) ${amountFilter}, 0)::float8 AS total_serviced_amount
    `;

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
            GROUP BY l.lguid, l.lguname, l.contactinfo
            ${orderByClause}
            ${paginationClause}
          `;

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM public.lgu l
            ${whereClause}
          `;

        return await Promise.all([
          client.query<LguAggregate>(dataQuery, [
            ...queryParams,
            ...[limit, (page - 1) * limit],
          ]),
          client.query<{ total: number }>(countQuery, countQueryParams),
        ]);
      },
    );

    const totalRecords = countResult.rows[0].total;
    res.json({
      data: dataResult.rows,
      meta: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    } satisfies GetLgusResponse);
  } catch (error) {
    next(error);
  }
}
