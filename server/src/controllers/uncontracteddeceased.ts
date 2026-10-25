import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import {
  getUncontractedDeceasedQuerySchema,
  type UncontractedDeceased,
} from 'shared';

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
  lifeplan_totalamount: 'lp.totalamount',
  lifeplan_use_benefits: 'lp.use_benefits',
  datecreated: 'dr.datecreated',
  managed_by_name: 'managed_by_name',
};

/**
 * Deceased records that do not have a contract yet.
 */
export const getUncontractedDeceased = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, search, status, caseid, sortBy, sortOrder } =
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
      lp.totalamount AS lifeplan_totalamount,
      lp.use_benefits AS lifeplan_use_benefits,
      dr.datecreated,
      CONCAT_WS(' ', NULLIF(s."firstName", ''), NULLIF(s."middleName", ''), NULLIF(s."lastName", '')) AS managed_by_name
    `;

    const fromAndJoins = `
      FROM public.deceasedrecord dr
      LEFT JOIN public.contract c ON dr.caseid = c.caseid
      LEFT JOIN public.representative r ON dr.representedby = r.representativeid
      LEFT JOIN public.staff s ON dr.managedby = s.id
      LEFT JOIN public.lifeplan lp ON dr.caseid = lp.caseid
    `;

    // Start building `whereClause`. The contract check is the whole point of
    // this endpoint, so it is always applied.
    const whereConditions: string[] = ['c.contractid IS NULL'];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (caseid !== undefined) {
      whereConditions.push(`dr.caseid = $${paramIndex}`);
      queryParams.push(caseid);
      paramIndex++;
    }

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

    const orderByClause = `ORDER BY ${
      UNCONTRACTED_SORT_COLUMNS[sortBy]
    } ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
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
          client.query<UncontractedDeceased>(dataQuery, [
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
    });
  } catch (error) {
    next(error);
  }
};
