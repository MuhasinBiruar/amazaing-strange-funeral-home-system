import type { PoolClient } from 'pg';
import pool from '@/db';

/**
 * Runs `callback` inside a plain `BEGIN`/`COMMIT` transaction (`READ
 * COMMITTED`, Postgres's default isolation level), rolling back on error.
 *
 * @remarks
 * Use this whenever the transaction takes a row lock (`SELECT ... FOR
 * UPDATE`) to safely read-then-mutate a row — e.g. incrementing/decrementing
 * a stock count without losing a concurrent update to the same row. Under
 * `READ COMMITTED`, `FOR UPDATE` simply waits for any conflicting lock to
 * release and then proceeds with the current committed data — no snapshot to
 * violate, so no serialization retry is ever needed.
 *
 * Do NOT use this for multi-query reads that need to agree on one consistent
 * snapshot (e.g. a paginated list's data query and its count query) — use
 * {@link withRepeatableRead} for that instead.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
