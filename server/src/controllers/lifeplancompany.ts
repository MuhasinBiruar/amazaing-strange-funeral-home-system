import pool from '@/db';
import { NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { Request, Response, NextFunction } from 'express';
import {
  getLifeplanCompaniesQuerySchema,
  type CreateLifeplanCompanyQuery,
} from 'shared';
import type { IdParam } from 'shared/utils';

const SORT_COLUMNS: Record<string, string> = {
  companyid: 'l.companyid',
  companyname: 'l.companyname',
  contactinfo: 'l.contactinfo',
  minimumthreshold: 'l.minimumthreshold',
  totalplans: 'totalplans',
  total_serviced_amount: 'total_serviced_amount',
};

export async function createLifeplanCompany(
  req: Request<{}, {}, CreateLifeplanCompanyQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = req.body;
    const result = await pool.query(
      `
        INSERT INTO lifeplancompany (
          companyname,
          contactinfo,
          minimumthreshold
        ) VALUES ($1, $2, $3) RETURNING companyid;`,
      [parsed.companyname, parsed.contactinfo, parsed.minimumthreshold],
    );
    res.locals.auditAction = `${res.locals.session.user.name} created a life plan company.`;

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getLifeplanCompany(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params as unknown as IdParam;
    const result = await pool.query(
      'SELECT * FROM lifeplancompany WHERE companyid = $1',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns a paginated summary of life plan companies.
 *
 * Each company includes the number of associated life plans and their total
 * serviced amount. When a date range is supplied, those aggregates are
 * calculated from cases created within the inclusive calendar range using
 * `deceasedrecord.datecreated`. Companies without matching plans remain in
 * the response with zero aggregate values.
 *
 * @param req Express request containing pagination, search, sorting, and date
 * range query parameters.
 * @param res Express response used to return company summaries and pagination
 * metadata.
 * @param next Express error handler callback.
 */
export async function getLifeplanCompanies(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, startDate, endDate, sortBy, sortOrder } =
      getLifeplanCompaniesQuerySchema.parse(req.query);

    const companySelectClause = `
      SELECT 
        l.companyid,
        l.companyname,
        l.minimumthreshold,
        l.contactinfo,
    `;

    const fromAndJoins = `
      FROM public.lifeplancompany l
      LEFT JOIN public.lifeplan lp
        ON l.companyid = lp.companyid
      LEFT JOIN public.deceasedrecord dr
        ON lp.caseid = dr.caseid
    `;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: lifeplancompany.companyname
      whereConditions.push(`(
        l.companyname ILIKE $${paramIndex}
      )`);
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
      aggregateDateConditions.push(`dr.datecreated < ($${paramIndex}::date + INTERVAL '1 day')`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const aggregateFilter =
      aggregateDateConditions.length > 0
        ? `FILTER (WHERE ${aggregateDateConditions.join(' AND ')})`
        : '';
    const selectClause = `
      ${companySelectClause}
        COUNT(lp.planid)${aggregateFilter ? ` ${aggregateFilter}` : ''}::int AS totalplans,
        COALESCE(SUM(lp.totalamount)${aggregateFilter ? ` ${aggregateFilter}` : ''}, 0)::float8 AS total_serviced_amount
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
            GROUP BY l.companyid, l.companyname, l.minimumthreshold, l.contactinfo
            ${orderByClause}
            ${paginationClause}
          `;

        const countQuery = `
            SELECT COUNT(*)::int as total
            FROM public.lifeplancompany l
            ${whereClause}
          `;

        return await Promise.all([
          client.query(dataQuery, [
            ...queryParams,
            ...[limit, (page - 1) * limit],
          ]),
          client.query(countQuery, countQueryParams),
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

export async function deleteLifeplanCompany(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params as unknown as IdParam;
    const result = await pool.query(
      'DELETE FROM lifeplancompany WHERE companyid = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.locals.auditAction = `${res.locals.session.user.name} deleted a life plan company.`;
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
