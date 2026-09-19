import type { PoolClient } from 'pg';
import pool from '@/db';

/**
 * Runs `callback` inside a `REPEATABLE READ` transaction, rolling back on
 * error.
 *
 * @remarks
 * Use this for **read-only** work that issues more than one query and needs
 * them to see a single consistent snapshot of the database — most commonly a
 * paginated list's data query and its count query, so the `total` reported
 * matches the page returned even if rows are inserted/deleted concurrently.
 *
 * Do NOT use this for a "read a row, lock it, then mutate it" pattern (e.g.
 * `SELECT ... FOR UPDATE` followed by an `UPDATE`) - `FOR UPDATE` under
 * `REPEATABLE READ` can throw `could not serialize access due to concurrent
 * update` (Postgres error `40001`) if the row was changed by another
 * transaction after this one's snapshot began, forcing a retry. For that
 * pattern, use {@link withTransaction} instead.
 */
export async function withRepeatableRead<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');

    const result = await callback(client);

    await client.query('COMMIT');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
