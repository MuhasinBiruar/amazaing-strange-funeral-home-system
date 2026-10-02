import pool from '@/db';
import type { AccessPage, NotificationType } from 'shared';

/** How often a payment reminder repeats while a balance is outstanding. */
export const PAYMENT_REMINDER_INTERVAL_DAYS = 7;

/** A full-payment notice is only raised for payments this recent. */
const FULL_PAYMENT_LOOKBACK_DAYS = 7;

const SWEEP_INTERVAL_MS = 2 * 60 * 1000;

interface Candidate {
  dedupekey: string;
  title: string;
  message: string;
  caseid: number | null;
  link: string | null;
}

interface Rule {
  type: NotificationType;
  /** Access pages whose holders see this notification. Admins see all. */
  audience: AccessPage[];
  /**
   * Resolvable rules mark their active notifications resolved once the
   * condition no longer holds (e.g. a casket is restocked), which also re-arms
   * them to fire again if the condition comes back.
   */
  resolvable: boolean;
  collect: () => Promise<Candidate[]>;
}

const formatPeso = (amount: number) =>
  `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DECEASED_NAME_SQL = `CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, ''))`;

const rules: Rule[] = [
  {
    type: 'low_casket',
    audience: ['inventory_page'],
    resolvable: true,
    collect: async () => {
      const result = await pool.query<{
        casketid: number;
        caskettype: string;
        caskettier: string | null;
        currentstock: number;
        minimumthreshold: number;
      }>(
        `SELECT casketid, caskettype, caskettier, currentstock, minimumthreshold
         FROM casketinventory
         WHERE currentstock <= minimumthreshold`,
      );

      return result.rows.map((row) => ({
        dedupekey: `low_casket:${row.casketid}`,
        title: 'Low casket stock',
        message: `${row.caskettype}${row.caskettier ? ` (${row.caskettier} tier)` : ''} needs to be reordered — ${row.currentstock} left, minimum is ${row.minimumthreshold}.`,
        caseid: null,
        link: '/dashboard/inventory',
      }));
    },
  },
  {
    type: 'low_formalin',
    audience: ['inventory_page'],
    resolvable: true,
    collect: async () => {
      const result = await pool.query<{
        formalinid: number;
        currentstock: number;
        minimumthreshold: number;
      }>(
        `SELECT formalinid, currentstock, minimumthreshold
         FROM formalininventory
         WHERE currentstock <= minimumthreshold`,
      );

      return result.rows.map((row) => ({
        dedupekey: `low_formalin:${row.formalinid}`,
        title: 'Urgent: low formalin stock',
        message: `Formalin stock #${row.formalinid} is at ${row.currentstock} (minimum ${row.minimumthreshold}). Restock as soon as possible.`,
        caseid: null,
        link: '/dashboard/inventory',
      }));
    },
  },
  {
    type: 'documents_complete',
    audience: ['case_page'],
    resolvable: true,
    collect: async () => {
      const result = await pool.query<{ caseid: number; name: string }>(
        `SELECT dr.caseid, ${DECEASED_NAME_SQL} AS name
         FROM deceasedrecord dr
         JOIN document d ON d.caseid = dr.caseid
         GROUP BY dr.caseid
         HAVING bool_and(d.verificationstatus = 'verified')`,
      );

      return result.rows.map((row) => ({
        dedupekey: `documents_complete:${row.caseid}`,
        title: 'Documents complete',
        message: `All documents for ${row.name || `case #${row.caseid}`} have been filled and verified.`,
        caseid: row.caseid,
        link: '/dashboard/case-management',
      }));
    },
  },
  {
    type: 'full_payment',
    audience: ['financial_page'],
    resolvable: false,
    collect: async () => {
      const result = await pool.query<{
        caseid: number;
        name: string;
        amount: number;
      }>(
        `SELECT t.caseid, ${DECEASED_NAME_SQL} AS name, t.amount
         FROM (
           SELECT DISTINCT ON (caseid) caseid, amount, remainingbalance, paymentdatetime
           FROM public.transaction
           WHERE transactionstatus = 'completed' AND paymentdatetime <= now()
           ORDER BY caseid, paymentdatetime DESC
         ) t
         JOIN deceasedrecord dr ON dr.caseid = t.caseid
         WHERE t.remainingbalance <= 0
           AND t.paymentdatetime >= now() - make_interval(days => $1::int)`,
        [FULL_PAYMENT_LOOKBACK_DAYS],
      );

      return result.rows.map((row) => ({
        dedupekey: `full_payment:${row.caseid}`,
        title: 'Full payment received',
        message: `${row.name || `Case #${row.caseid}`} has been fully paid (final payment ${formatPeso(Number(row.amount))}).`,
        caseid: row.caseid,
        link: null,
      }));
    },
  },
  {
    // Resolvable so the previous period's reminder (and any reminder for a
    // case that has since been paid off) is closed out when a newer one fires.
    type: 'payment_reminder',
    audience: ['financial_page'],
    resolvable: true,
    collect: async () => {
      const result = await pool.query<{
        caseid: number;
        name: string;
        remainingbalance: number;
        period: number;
      }>(
        `WITH completed AS (
           SELECT caseid, remainingbalance, paymentdatetime
           FROM public.transaction
           WHERE transactionstatus = 'completed' AND paymentdatetime <= now()
         ),
         latest AS (
           SELECT DISTINCT ON (caseid) caseid, remainingbalance
           FROM completed
           ORDER BY caseid, paymentdatetime DESC
         ),
         first AS (
           SELECT caseid, MIN(paymentdatetime) AS firstpayment
           FROM completed
           GROUP BY caseid
         )
         SELECT
           l.caseid,
           ${DECEASED_NAME_SQL} AS name,
           l.remainingbalance,
           FLOOR(EXTRACT(EPOCH FROM now() - f.firstpayment) / 86400 / $1::int)::int AS period
         FROM latest l
         JOIN first f ON f.caseid = l.caseid
         JOIN deceasedrecord dr ON dr.caseid = l.caseid
         WHERE l.remainingbalance > 0
           AND now() - f.firstpayment >= make_interval(days => $1::int)`,
        [PAYMENT_REMINDER_INTERVAL_DAYS],
      );

      return result.rows.map((row) => ({
        dedupekey: `payment_reminder:${row.caseid}:${row.period}`,
        title: 'Payment reminder',
        message: `${row.name || `Case #${row.caseid}`} still has a remaining balance of ${formatPeso(Number(row.remainingbalance))}.`,
        caseid: row.caseid,
        link: null,
      }));
    },
  },
  {
    type: 'advanced_decomposition',
    audience: ['inventory_page', 'case_page'],
    resolvable: true,
    collect: async () => {
      const result = await pool.query<{ caseid: number; name: string }>(
        `SELECT dr.caseid, ${DECEASED_NAME_SQL} AS name
         FROM deceasedrecord dr
         WHERE dr.hasadvanceddecomposition`,
      );

      return result.rows.map((row) => ({
        dedupekey: `advanced_decomposition:${row.caseid}`,
        title: 'High formalin consumption expected',
        message: `${row.name || `Case #${row.caseid}`} is flagged for advanced decomposition / open wounds. Expect elevated formalin usage.`,
        caseid: row.caseid,
        link: '/dashboard/case-management',
      }));
    },
  },
];

async function applyRule(rule: Rule) {
  const candidates = await rule.collect();
  const keys = candidates.map((c) => c.dedupekey);

  if (candidates.length > 0) {
    // The partial unique index on active (unresolved) dedupe keys makes this
    // idempotent: a condition that's already been notified is skipped.
    await pool.query(
      `INSERT INTO notification (type, audience, title, message, caseid, link, dedupekey)
       SELECT $1, $2::text[], c.title, c.message, c.caseid, c.link, c.dedupekey
       FROM unnest($3::text[], $4::text[], $5::int[], $6::text[], $7::text[])
         AS c(title, message, caseid, link, dedupekey)
       ON CONFLICT (dedupekey) WHERE resolvedat IS NULL DO NOTHING`,
      [
        rule.type,
        rule.audience,
        candidates.map((c) => c.title),
        candidates.map((c) => c.message),
        candidates.map((c) => c.caseid),
        candidates.map((c) => c.link),
        keys,
      ],
    );
  }

  if (rule.resolvable) {
    await pool.query(
      `UPDATE notification SET resolvedat = now()
       WHERE type = $1 AND resolvedat IS NULL AND NOT (dedupekey = ANY($2::text[]))`,
      [rule.type, keys],
    );
  }
}

/**
 * Re-evaluates every notification rule against the current database state,
 * creating notifications for newly-true conditions and resolving ones whose
 * condition has cleared.
 *
 * @remarks
 * Condition-based rather than event-based, so it doesn't matter which code
 * path changed the data (an API route, a seed script, or a manual edit in
 * Supabase) — the next sweep catches it.
 */
export async function runNotificationSweep() {
  for (const rule of rules) {
    try {
      await applyRule(rule);
    } catch (error) {
      console.error(`Notification rule "${rule.type}" failed:`, error);
    }
  }
}

let sweeping = false;
let sweepQueued = false;

/**
 * Fire-and-forget sweep, safe to call after any write. Overlapping calls are
 * coalesced into at most one follow-up run so a change made mid-sweep is never
 * missed.
 */
export function triggerNotificationSweep() {
  if (sweeping) {
    sweepQueued = true;
    return;
  }

  sweeping = true;
  void runNotificationSweep().finally(() => {
    sweeping = false;
    if (sweepQueued) {
      sweepQueued = false;
      triggerNotificationSweep();
    }
  });
}

/**
 * Runs a sweep now and then on a fixed interval, which is what drives the
 * time-based rules (payment reminders, the full-payment lookback window).
 */
export function startNotificationScheduler() {
  triggerNotificationSweep();
  setInterval(triggerNotificationSweep, SWEEP_INTERVAL_MS).unref();
}
