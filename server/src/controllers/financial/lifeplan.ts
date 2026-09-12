import pool from '@/db';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import { getLifeplansQuerySchema, type CreateLifeplanQuery } from 'shared';

const SORT_COLUMNS: Record<string, string> = {
  planid: 'l.planid',
  plannumber: 'l.plannumber',
  planholdername: 'l.planholdername',
  minimumthreshold: 'l.minimumthreshold',
  totalamount: 'l.totalamount',
  caseid: 'l.caseid',
  deceased_name: 'deceased_name',
  companyid: 'l.companyid',
  company_name: 'lc.companyname',
};

export async function createLifeplan(
  req: Request<{}, {}, CreateLifeplanQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = req.body;
    const result = await pool.query(
      `
        INSERT INTO lifeplan (
          plannumber,
          planholdername,
          minimumthreshold,
          totalamount,
          caseid,
          companyid
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING planid;`,
      [
        parsed.plannumber,
        parsed.planholdername,
        parsed.minimumthreshold,
        parsed.totalamount,
        parsed.caseid,
        parsed.companyid,
      ],
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getLifeplan(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getLifeplansQuerySchema.parse(req.query);

    const selectClause = `
        SELECT 
          l.planid,
          l.plannumber,
          l.planholdername,
          l.minimumthreshold,
          l.totalamount,
          l.caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
          l.companyid,
          lc.companyname AS company_name
      `;

    const fromAndJoins = `
        FROM public.lifeplan l
        LEFT JOIN public.deceasedrecord dr ON l.caseid = dr.caseid
        LEFT JOIN public.lifeplancompany lc ON l.companyid = lc.companyid
      `;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: lifeplan.plannumber, lifeplan.planholdername,
      // lifeplan.caseid, deceasedrecord.name, lifeplancompany.companyname
      whereConditions.push(`(
          l.plannumber ILIKE $${paramIndex} OR
          l.planholdername ILIKE $${paramIndex} OR
          l.caseid::text ILIKE $${paramIndex} OR
          CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex} OR
          lc.companyname ILIKE $${paramIndex}
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
            SELECT COUNT(l.planid) as total
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
