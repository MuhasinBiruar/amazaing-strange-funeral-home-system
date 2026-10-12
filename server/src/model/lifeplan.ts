import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { GetLifeplansQuery, GetLifeplansQueryRow } from 'shared';

const SORT_COLUMNS: Record<keyof GetLifeplansQueryRow, string> = {
  planid: 'l.planid',
  plannumber: 'l.plannumber',
  planholdername: 'l.planholdername',
  totalamount: 'l.totalamount',
  caseid: 'l.caseid',
  deceased_name: 'deceased_name',
  representative_name: 'representative_name',
  companyid: 'l.companyid',
  companyname: 'lc.companyname',
};

export const getLifeplans = async (query: GetLifeplansQuery) => {
  const { page, limit, search, companyid, sortBy, sortOrder } = query;

  const selectClause = `
    SELECT 
      l.planid,
      l.plannumber,
      l.planholdername,
      l.totalamount,
      l.caseid,
      CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
      CONCAT_WS(' ', NULLIF(r.firstname, ''), NULLIF(r.middlename, ''), NULLIF(r.lastname, '')) AS representative_name,
      l.companyid,
      lc.companyname
  `;

  const fromAndJoins = `
    FROM public.lifeplan l
    LEFT JOIN public.deceasedrecord dr ON l.caseid = dr.caseid
    LEFT JOIN public.representative r ON dr.representedby = r.representativeid
    LEFT JOIN public.lifeplancompany lc ON l.companyid = lc.companyid
  `;

  // Start building `whereClause`
  const whereConditions: string[] = [];
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (companyid !== undefined) {
    whereConditions.push(`l.companyid = $${paramIndex}`);
    queryParams.push(companyid);
    paramIndex++;
  }

  if (search) {
    // Searches through: lifeplan.plannumber, lifeplan.planholdername,
    // deceasedrecord.name, representative.name, lifeplancompany.companyname
    whereConditions.push(`(
      l.plannumber ILIKE $${paramIndex} OR
      l.planholdername ILIKE $${paramIndex} OR
      CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex} OR
      CONCAT_WS(' ', r.firstname, r.middlename, r.lastname) ILIKE $${paramIndex} OR
      lc.companyname ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  // Finish building `whereClause`

  const orderByClause = `ORDER BY
    ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
  const paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const [dataResult, countResult] = await withRepeatableRead(async (client) => {
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
      client.query<GetLifeplansQueryRow>(dataQuery, [
        ...queryParams,
        ...[limit, (page - 1) * limit],
      ]),
      client.query<{ total: string }>(countQuery, queryParams),
    ]);
  });

  return {
    dataResult,
    countResult,
  };
};
