import cron from 'node-cron';
import pool from '@/db';
import type { PoolClient } from 'pg';

export const SERVICE_STATUS_TIMEZONE =
  process.env.SERVICE_STATUS_TIMEZONE ?? 'Asia/Manila';

export const UPDATE_SERVICE_STATUSES_SQL = `
  WITH calculated AS (
    SELECT
      dr.caseid,
      CASE
        WHEN c.contractid IS NULL THEN dr.servicestatus::text
        WHEN COALESCE(documents.complete, true) = false THEN 'pending'
        WHEN dr.plantype = 'Direct' THEN
          CASE
            WHEN COALESCE(pay.totalpaid, 0) >= c.totalamount
              AND c.burialdatedeadline <= timezone($1::text, now())::date
              THEN 'completed'
            WHEN COALESCE(pay.totalpaid, 0) >= c.totalamount
              OR c.burialdatedeadline <= timezone($1::text, now())::date
              THEN 'pending'
            ELSE 'active'
          END
        WHEN dr.plantype = 'LGU' THEN
          CASE
            WHEN lc.reimbursementstatus = 'released'
              AND c.burialdatedeadline <= timezone($1::text, now())::date
              THEN 'completed'
            ELSE 'pending'
          END
        WHEN dr.plantype = 'Life' AND lp.planid IS NOT NULL THEN
          CASE
            WHEN COALESCE(lp.use_benefits, true) = false
              AND c.totalamount - COALESCE(pay.totalpaid, 0) > 0 THEN
              CASE
                WHEN c.burialdatedeadline <= timezone($1::text, now())::date
                  THEN 'pending'
                ELSE 'active'
              END
            WHEN c.burialdatedeadline <= timezone($1::text, now())::date
              THEN 'completed'
            ELSE 'pending'
          END
        ELSE dr.servicestatus::text
      END::public.service_status_enum AS servicestatus
    FROM public.deceasedrecord dr
    LEFT JOIN public.contract c ON c.caseid = dr.caseid
    LEFT JOIN public.lgucase lc ON lc.caseid = dr.caseid
    LEFT JOIN public.lifeplan lp ON lp.caseid = dr.caseid
    LEFT JOIN (
      SELECT caseid,
        COALESCE(SUM(
          CASE WHEN paymentcategory = 'Refund' THEN -amount ELSE amount END
        ) FILTER (WHERE transactionstatus = 'completed'), 0) AS totalpaid
      FROM public.transaction
      GROUP BY caseid
    ) pay ON pay.caseid = dr.caseid
    LEFT JOIN (
      SELECT caseid,
        bool_and(filename IS NOT NULL AND verificationstatus = 'verified')
          AS complete
      FROM public.document
      GROUP BY caseid
    ) documents ON documents.caseid = dr.caseid
    WHERE $2::int IS NULL OR dr.caseid = $2
  )
  UPDATE public.deceasedrecord dr
  SET servicestatus = calculated.servicestatus
  FROM calculated
  WHERE dr.caseid = calculated.caseid
    AND dr.servicestatus IS DISTINCT FROM calculated.servicestatus
`;

export async function refreshServiceStatuses(
  client: PoolClient,
  caseid: number,
) {
  await client.query(UPDATE_SERVICE_STATUSES_SQL, [
    SERVICE_STATUS_TIMEZONE,
    caseid,
  ]);
}

export async function runServiceStatusSweep() {
  await pool.query(UPDATE_SERVICE_STATUSES_SQL, [SERVICE_STATUS_TIMEZONE, null]);
}

export function startServiceStatusScheduler() {
  const runSweep = () => {
    void runServiceStatusSweep().catch((error) => {
      console.error('Service status sweep failed:', error);
    });
  };

  runSweep();
  cron.schedule('*/2 * * * *', runSweep, {
    timezone: SERVICE_STATUS_TIMEZONE,
  });
}
