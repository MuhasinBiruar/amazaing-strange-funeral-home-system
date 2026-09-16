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
          contactinfo
        ) VALUES ($1, $2) RETURNING companyid;`,
      [parsed.companyname, parsed.contactinfo],
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

export async function getLifeplanCompanies(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getLifeplanCompaniesQuerySchema.parse(req.query);

    const selectClause = `
      SELECT 
        l.companyid,
        l.companyname,
        l.contactinfo
    `;

    const fromAndJoins = `
      FROM public.lifeplancompany l
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
            SELECT COUNT(l.companyid) as total
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
