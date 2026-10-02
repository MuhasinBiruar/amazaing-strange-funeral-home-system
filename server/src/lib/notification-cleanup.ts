import cron from 'node-cron';
import pool from '@/db';

/**
 * Runs at 01:00 on the 1st and 15th of each month.
 *
 * This is the calendar-based equivalent of a biweekly maintenance window. The
 * cleanup threshold itself is fourteen days, so a notification is eligible as
 * soon as it is at least two weeks old.
 */
const CLEANUP_CRON = '0 1 1,15 * *';
const CLEANUP_TIMEZONE =
  process.env.NOTIFICATION_CLEANUP_TIMEZONE ?? 'Asia/Manila';
const CLEANUP_LOCK_KEY = 581274;

/**
 * Deletes resolved notification history older than fourteen days.
 *
 * Unresolved notifications are intentionally retained because they represent
 * active conditions. Deleting one would allow the next notification sweep to
 * create the same alert again.
 */
export async function purgeOldNotifications() {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    const lockResult = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [CLEANUP_LOCK_KEY],
    );
    lockAcquired = lockResult.rows[0].locked;

    if (!lockAcquired) return;

    const result = await client.query(
      `DELETE FROM notification
       WHERE resolvedat IS NOT NULL
         AND createdat <= now() - interval '14 days'`,
    );

    if (result.rowCount) {
      console.log(
        `Notification cleanup deleted ${result.rowCount} resolved notification(s).`,
      );
    }
  } finally {
    if (lockAcquired) {
      await client.query('SELECT pg_advisory_unlock($1)', [CLEANUP_LOCK_KEY]);
    }
    client.release();
  }
}

/**
 * Registers the biweekly notification-history cleanup.
 *
 * The job is deliberately registered in the server process rather than in a
 * request handler. PostgreSQL's advisory lock keeps it safe if deployment
 * starts more than one server instance.
 */
export function startNotificationCleanupScheduler() {
  cron.schedule(
    CLEANUP_CRON,
    () => {
      void purgeOldNotifications().catch((error) => {
        console.error('Notification cleanup failed:', error);
      });
    },
    { timezone: CLEANUP_TIMEZONE },
  );
}
