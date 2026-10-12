import pool from '@/db';

/** Returns audit history with the newest action first. */
export async function getAuditLogs() {
  return pool.query(
    `SELECT
       al.auditlogid,
       al.actiondate,
       al.action
     FROM auditlog al
     ORDER BY al.actiondate DESC, al.auditlogid DESC`,
  );
}
