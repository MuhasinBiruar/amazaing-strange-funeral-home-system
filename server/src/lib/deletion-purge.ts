import cron from 'node-cron';
import pool from '@/db';
import { deleteDocumentFiles } from '@/lib/s3';

/**
 * Runs at 01:30 (1:30 AM) everyday.
 */
const PURGE_CRON = '30 1 * * *';
const PURGE_TIMEZONE = process.env.DELETION_PURGE_TIMEZONE ?? 'Asia/Manila';
const PURGE_LOCK_KEY = 581275;

/**
 * Permanently removes Deleted items entries past their 30 days, along with
 * their uploaded files.
 *
 * Each entry's files are deleted before the entry itself. If storage fails,
 * the entry is kept and retried on the next run, so no file is ever left
 * behind without a record of it.
 */
export async function purgeExpiredDeletions() {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    const lockResult = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [PURGE_LOCK_KEY],
    );
    lockAcquired = lockResult.rows[0].locked;

    if (!lockAcquired) return;

    const expired = await client.query<{
      deletionid: number;
      files: string[];
    }>(
      `SELECT deletionid, files FROM deletion
       WHERE purgeafter <= now()
       ORDER BY deletionid`,
    );

    let purged = 0;
    for (const { deletionid, files } of expired.rows) {
      try {
        if (files.length > 0) await deleteDocumentFiles(files);
        await client.query('DELETE FROM deletion WHERE deletionid = $1', [
          deletionid,
        ]);
        purged++;
      } catch (error) {
        console.error(
          `Could not purge deleted item #${deletionid}; retrying next run:`,
          error,
        );
      }
    }

    if (purged > 0) {
      console.log(`Deletion purge removed ${purged} expired item(s).`);
    }
  } finally {
    if (lockAcquired) {
      await client.query('SELECT pg_advisory_unlock($1)', [PURGE_LOCK_KEY]);
    }
    client.release();
  }
}

/**
 * Purges once at startup (in case the server was off at the scheduled time),
 * then daily. The advisory lock keeps it safe with several server instances.
 */
export function startDeletionPurgeScheduler() {
  const run = () => {
    void purgeExpiredDeletions().catch((error) => {
      console.error('Deletion purge failed:', error);
    });
  };

  run();
  cron.schedule(PURGE_CRON, run, { timezone: PURGE_TIMEZONE });
}
