import pool from '@/db';
import { ConflictError, NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { PoolClient } from 'pg';
import type { GetPaginatedCasketInventoryQuery } from 'shared';

const SORT_COLUMNS = {
  casketid: 'casketid',
  caskettype: 'caskettype',
  currentstock: 'currentstock',
} as const;

export const getPaginatedCasketInventory = async ({
  page,
  limit,
  search,
  sortBy,
  sortOrder,
}: GetPaginatedCasketInventoryQuery) => {
  // Start building `whereClause`
  const whereConditions: string[] = [];
  const queryParams: unknown[] = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(
      casketid::text ILIKE $${paramIndex} OR
      caskettype ILIKE $${paramIndex} OR
      currentstock::text ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  // Finish building `whereClause`

  const orderByClause = `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
  const paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const [dataResult, countResult] = await withRepeatableRead(async (client) =>
    Promise.all([
      client.query(
        `
          SELECT casketid, caskettype, caskettier, currentstock, minimumthreshold
          FROM casketinventory
          ${whereClause}
          ${orderByClause}
          ${paginationClause}
        `,
        [...queryParams, limit, (page - 1) * limit],
      ),
      client.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM casketinventory ${whereClause}`,
        queryParams,
      ),
    ]),
  );

  return { dataResult, countResult };
};

/**
 * Throws if another casket already uses `caskettype` (case-insensitive), so
 * the casket picker never shows two identically named caskets.
 *
 * @param excludeCasketId The casket being edited, which may keep its own name.
 */
export async function assertCasketNameAvailable(
  caskettype: string,
  excludeCasketId?: number,
) {
  const result = await pool.query(
    `SELECT 1 FROM casketinventory
    WHERE lower(caskettype) = lower($1) AND casketid <> COALESCE($2, -1)`,
    [caskettype, excludeCasketId ?? null],
  );

  if (result.rows.length > 0)
    throw new ConflictError(`A casket named "${caskettype}" already exists.`);
}

export async function assertCasketCanBeDeleted(
  client: PoolClient,
  casketId: string,
) {
  const casketResult = await client.query<{ caskettype: string }>(
    'SELECT caskettype FROM casketinventory WHERE casketid = $1 FOR UPDATE',
    [casketId],
  );
  if (casketResult.rows.length === 0)
    throw new NotFoundError('Casket not found.');

  const { caskettype } = casketResult.rows[0];

  const packageResult = await client.query<{ packagename: string }>(
    'SELECT packagename FROM package WHERE casketid = $1 ORDER BY packagename',
    [casketId],
  );
  if (packageResult.rows.length > 0) {
    const names = packageResult.rows.map((p) => p.packagename);
    throw new ConflictError(
      `${caskettype} can't be deleted because ${names.length === 1 ? 'a package uses' : `${names.length} packages use`} it: ${names.join(', ')}. Change or remove ${names.length === 1 ? 'that package' : 'those packages'} first.`,
    );
  }

  const historyResult = await client.query<{
    deliveries: number;
    audits: number;
  }>(
    `SELECT
      (SELECT COUNT(*)::int FROM casketdelivery WHERE casketid = $1) AS deliveries,
      (SELECT COUNT(*)::int FROM inventoryaudit WHERE casketid = $1) AS audits`,
    [casketId],
  );
  const { deliveries, audits } = historyResult.rows[0];

  if (deliveries > 0 || audits > 0) {
    const history = [
      deliveries > 0 &&
        `${deliveries} recorded deliver${deliveries === 1 ? 'y' : 'ies'}`,
      audits > 0 && `${audits} inventory audit${audits === 1 ? '' : 's'}`,
    ].filter(Boolean);

    throw new ConflictError(
      `${caskettype} can't be deleted because it has ${history.join(' and ')}. Deleting it would leave that history without a casket.`,
    );
  }

  return caskettype;
}
