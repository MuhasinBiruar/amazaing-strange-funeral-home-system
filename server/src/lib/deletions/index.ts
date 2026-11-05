import { DatabaseError } from 'pg';
import {
  DELETION_RETENTION_DAYS,
  type DeletionEntityType,
  type DeletionResult,
} from 'shared';
import { AppError, ConflictError, NotFoundError } from '@/errors';
import { withTransaction } from '@/util/with-transaction';
import {
  ENTITIES,
  summarize,
  TABLE_NAMES,
  type SnapshotTable,
} from './entities';

/**
 * Moves one record (and everything deleted with it) to Deleted items: saves
 * the rows as a snapshot, then really deletes them, all in one transaction.
 *
 * @returns The record's label, e.g. "Juan Dela Cruz (case #12)".
 */
async function deleteRecord(
  entitytype: DeletionEntityType,
  id: number,
  staffid: string,
): Promise<string> {
  const entity = ENTITIES[entitytype];

  return withTransaction(async (client) => {
    const { label, tables, files } = await entity.collect(client, id);
    await entity.onDelete?.(client, tables);

    // Children first, so no foreign key is left pointing at a deleted row.
    for (const { table, key, rows, keep } of [...tables].reverse()) {
      if (keep || rows.length === 0) continue;
      await client.query(`DELETE FROM public.${table} WHERE ${key} = ANY($1)`, [
        rows.map((row) => row[key]),
      ]);
    }

    await client.query(
      `INSERT INTO deletion (
         entitytype, entityid, label, summary, snapshot, files, deletedby, purgeafter
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, now() + make_interval(days => $8))`,
      [
        entitytype,
        id,
        label,
        summarize(entity.table, tables),
        JSON.stringify(tables),
        files,
        staffid,
        DELETION_RETENTION_DAYS,
      ],
    );

    return label;
  });
}

/** Explains why a snapshot row couldn't go back in. */
function toRestoreError(error: unknown, label: string): unknown {
  if (!(error instanceof DatabaseError)) return error;

  if (error.code === '23503') {
    // e.g. Key (companyid)=(3) is not present in table "lifeplancompany".
    const missing = error.detail?.match(/table "(\w+)"/)?.[1];
    const name = missing ? (TABLE_NAMES[missing]?.[0] ?? missing) : 'record';
    return new ConflictError(
      `${label} can't be restored because its ${name} was deleted. Restore that first.`,
    );
  }

  if (error.code === '23505') {
    // e.g. Key (ornumber)=(OR-0001) already exists.
    const match = error.detail?.match(/Key \((.+?)\)=\((.+?)\) already exists/);
    const name = error.table
      ? (TABLE_NAMES[error.table]?.[0] ?? error.table)
      : 'record';
    return new ConflictError(
      match
        ? `${label} can't be restored because another ${name} already has ${match[1]} ${match[2]}.`
        : `${label} can't be restored because another ${name} already exists in its place.`,
    );
  }

  return error;
}

/**
 * Puts a Deleted items entry's rows back exactly as they were (same IDs),
 * reverses its side effects, and removes the entry.
 *
 * @returns The restored record's label.
 */
async function restoreDeletion(deletionid: number): Promise<string> {
  return withTransaction(async (client) => {
    const result = await client.query<{
      entitytype: DeletionEntityType;
      label: string;
      snapshot: SnapshotTable[];
    }>(
      `SELECT entitytype, label, snapshot FROM deletion
       WHERE deletionid = $1 AND purgeafter > now()
       FOR UPDATE`,
      [deletionid],
    );
    if (result.rows.length === 0) {
      throw new NotFoundError(
        'This item was already restored or permanently deleted.',
      );
    }
    const { entitytype, label, snapshot } = result.rows[0];

    for (const { table, rows, shared } of snapshot) {
      if (rows.length === 0) continue;
      try {
        await client.query(
          `INSERT INTO public.${table}
           SELECT * FROM jsonb_populate_recordset(NULL::public.${table}, $1::jsonb)
           ${shared ? 'ON CONFLICT DO NOTHING' : ''}`,
          [JSON.stringify(rows)],
        );
      } catch (error) {
        throw toRestoreError(error, label);
      }
    }

    await ENTITIES[entitytype].onRestore?.(client, snapshot);
    await client.query('DELETE FROM deletion WHERE deletionid = $1', [
      deletionid,
    ]);

    return label;
  });
}

function failureMessage(error: unknown) {
  if (error instanceof AppError) return error.message;
  console.error('Deleted items operation failed:', error);
  return 'Something went wrong. Try again.';
}

/**
 * Runs `action` on each id in its own transaction, so one blocked record
 * (e.g. still in use) doesn't stop the rest.
 */
async function eachSeparately(
  ids: number[],
  action: (id: number) => Promise<string>,
): Promise<DeletionResult> {
  const result: DeletionResult = { succeeded: [], failed: [] };

  for (const id of new Set(ids)) {
    try {
      result.succeeded.push({ id, label: await action(id) });
    } catch (error) {
      result.failed.push({ id, label: null, message: failureMessage(error) });
    }
  }

  return result;
}

export function deleteRecords(
  entitytype: DeletionEntityType,
  ids: number[],
  staffid: string,
) {
  return eachSeparately(ids, (id) => deleteRecord(entitytype, id, staffid));
}

/**
 * Restores entries, retrying the ones that failed as long as each pass
 * restores something, so picking a casket and its delivery together works
 * whatever order they come in (the casket has to go back first).
 */
export async function restoreDeletions(deletionids: number[]) {
  const result = await eachSeparately(deletionids, restoreDeletion);

  while (result.failed.length > 0) {
    const retry = await eachSeparately(
      result.failed.map((failure) => failure.id),
      restoreDeletion,
    );
    if (retry.succeeded.length === 0) break;
    result.succeeded.push(...retry.succeeded);
    result.failed = retry.failed;
  }

  return result;
}
