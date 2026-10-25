import cron from 'node-cron';
import pool from '@/db';

const SERVICE_STATUS_TIMEZONE =
  process.env.SERVICE_STATUS_TIMEZONE ?? 'Asia/Manila';

export async function runServiceStatusSweep() {
  await pool.query(`
    WITH payments AS (
      SELECT
        caseid,
        COALESCE(SUM(
          CASE WHEN paymentcategory = 'Refund' THEN -amount ELSE amount END
        ), 0) AS amountpaid
      FROM public.transaction
      WHERE transactionstatus = 'completed'
      GROUP BY caseid
    ),
    burial_dates AS (
      SELECT caseid, MAX(burialdate)::date AS burialdate
      FROM public.burialrecord
      GROUP BY caseid
    ),
    latest_lgu_status AS (
      SELECT DISTINCT ON (caseid) caseid, reimbursementstatus
      FROM public.lgucase
      ORDER BY caseid, lgucaseid DESC
    ),
    case_statuses AS (
      SELECT
        dr.caseid,
        CASE
          WHEN dr.plantype = 'Direct' THEN
            CASE
              WHEN COALESCE(payments.amountpaid, 0) >= c.totalamount THEN
                CASE WHEN burial.reached THEN 'completed' ELSE 'pending' END
              ELSE 'active'
            END
          WHEN dr.plantype = 'LGU' THEN
            CASE
              WHEN lgu.reimbursementstatus = 'approved' THEN 'pending'
              WHEN lgu.reimbursementstatus = 'released' THEN
                CASE WHEN burial.reached THEN 'completed' ELSE 'pending' END
              WHEN burial.reached THEN 'pending'
              WHEN lgu.reimbursementstatus = 'pending' OR lgu.reimbursementstatus IS NULL THEN 'active'
              ELSE 'active'
            END
          WHEN dr.plantype = 'Life' THEN
            CASE
              WHEN COALESCE(lifeplan.use_benefits, true) THEN
                CASE WHEN burial.reached THEN 'completed' ELSE 'pending' END
              WHEN GREATEST(c.totalamount - COALESCE(payments.amountpaid, 0), 0) > 0 THEN
                CASE WHEN burial.reached THEN 'pending' ELSE 'active' END
              WHEN burial.reached THEN 'completed'
              ELSE 'active'
            END
        END::service_status_enum AS servicestatus
      FROM public.deceasedrecord dr
      JOIN public.contract c ON c.caseid = dr.caseid
      LEFT JOIN payments ON payments.caseid = dr.caseid
      LEFT JOIN burial_dates bd ON bd.caseid = dr.caseid
      LEFT JOIN latest_lgu_status lgu ON lgu.caseid = dr.caseid
      LEFT JOIN LATERAL (
        SELECT use_benefits
        FROM public.lifeplan
        WHERE caseid = dr.caseid
        ORDER BY planid DESC
        LIMIT 1
      ) lifeplan ON true
      CROSS JOIN LATERAL (
        SELECT
          COALESCE(bd.burialdate, c.burialdatedeadline::date)
            < (now() AT TIME ZONE 'Asia/Manila')::date AS reached
      ) burial
    )
    UPDATE public.deceasedrecord dr
    SET servicestatus = case_statuses.servicestatus
    FROM case_statuses
    WHERE dr.caseid = case_statuses.caseid
      AND case_statuses.servicestatus IS NOT NULL
      AND dr.servicestatus IS DISTINCT FROM case_statuses.servicestatus
  `);
}

let sweeping = false;
let sweepQueued = false;

export function triggerServiceStatusSweep() {
  if (sweeping) {
    sweepQueued = true;
    return;
  }

  sweeping = true;
  void runServiceStatusSweep()
    .catch((error) => {
      console.error('Service status sweep failed:', error);
    })
    .finally(() => {
      sweeping = false;
      if (sweepQueued) {
        sweepQueued = false;
        triggerServiceStatusSweep();
      }
    });
}

export function startServiceStatusScheduler() {
  triggerServiceStatusSweep();
  cron.schedule(
    '0 0 * * *',
    triggerServiceStatusSweep,
    { timezone: SERVICE_STATUS_TIMEZONE },
  );
}
