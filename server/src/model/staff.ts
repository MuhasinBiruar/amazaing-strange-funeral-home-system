import pool from '@/db';
import { NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import {
  accessPageEnum,
  GetStaffResponse,
  type GetStaffQuery,
  type Staff,
} from 'shared';

const SORT_COLUMNS: Record<GetStaffQuery['sortBy'], string> = {
  id: 's.id',
  name: 's.name',
  username: 's.username',
  role: 's.role',
  jobRole: 's."jobRole"',
  isActive: 's."isActive"',
  access: 'access_count',
};

const ACCESS_JSON_FIELDS = accessPageEnum.options
  .map((key) => `'${key}', COALESCE(a.${key}, false)`)
  .join(',\n            ');

const ACCESS_COUNT_EXPR = accessPageEnum.options
  .map((key) => `COALESCE(a.${key}::int, 0)`)
  .join(' + ');

export const getStaff = async (query: GetStaffQuery) => {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const selectClause = `
    SELECT
      s.id,
      s.name,
      s.username,
      s.role,
      s."jobRole",
      s."isActive",
      json_build_object(
        ${ACCESS_JSON_FIELDS}
      ) AS access,
      (${ACCESS_COUNT_EXPR}) AS access_count
  `;

  const fromAndJoins = `
    FROM public.staff s
    LEFT JOIN public.access a ON a.staffid = s.id
  `;

  const whereConditions: string[] = [];
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    // Searches through: staff.name, staff.username, staff.role, staff.jobRole
    whereConditions.push(`(
      s.name ILIKE $${paramIndex} OR
      s.username ILIKE $${paramIndex} OR
      s.role ILIKE $${paramIndex} OR
      s."jobRole" ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (isActive !== undefined) {
    whereConditions.push(`s."isActive" = $${paramIndex}`);
    queryParams.push(isActive);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // "Admins first" only applies to the default sort (jobRole)
  const orderByClause =
    sortBy === 'jobRole'
      ? `ORDER BY CASE WHEN s.role = 'admin' THEN 0 ELSE 1 END, s."jobRole" ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`
      : `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;

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
      SELECT COUNT(s.id) as total
      ${fromAndJoins}
      ${whereClause}
    `;

    return await Promise.all([
      client.query<GetStaffResponse['data'][number]>(dataQuery, [
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

export const getStaffById = async (id: string) => {
  const result = await pool.query<Staff>('SELECT * FROM staff WHERE id = $1', [
    id,
  ]);
  if (result.rows.length === 0) throw new NotFoundError();

  return result.rows[0];
};

export async function doesNameExist(
  firstName: string,
  lastName: string,
  excludeId?: string,
) {
  const result = await pool.query(
    `SELECT id FROM staff WHERE "firstName" = $1 AND "lastName" = $2 AND id <> COALESCE($3, '')`,
    [firstName, lastName, excludeId ?? null],
  );

  return result.rows.length > 0;
}

export const doesUsernameExist = async (
  username: string,
  excludeId?: string,
) => {
  const result = await pool.query<Staff>(
    `SELECT 1 FROM staff WHERE username = $1 AND id <> COALESCE($2, '')`,
    [username, excludeId ?? null],
  );

  return result.rows.length > 0;
};
