import pool from '@/db';
import { NotFoundError } from '@/errors';
import { accessPageEnum, type Access, type AccessPage } from 'shared';

export async function getAccess(staffid: string) {
  const result = await pool.query<Access>(
    'SELECT * FROM access WHERE staffid = $1',
    [staffid],
  );
  if (result.rows.length === 0) throw new NotFoundError();

  return result.rows[0];
}

/**
 * Creates or updates a staff member's page access permissions.
 */
export async function upsertAccess(
  staffid: string,
  access?: Partial<Record<AccessPage, boolean>>,
) {
  console.log(access);
  const columns = accessPageEnum.options.join(', ');
  const placeholders = accessPageEnum.options
    .map((_, i) => `$${i + 2}`)
    .join(', ');
  const updates = accessPageEnum.options
    .map((key) => `${key} = EXCLUDED.${key}`)
    .join(', ');

  await pool.query(
    `INSERT INTO access (staffid, ${columns})
      VALUES ($1, ${placeholders})
      ON CONFLICT (staffid) DO UPDATE SET ${updates}`,
    [staffid, ...accessPageEnum.options.map((key) => access?.[key] ?? false)],
  );
}
