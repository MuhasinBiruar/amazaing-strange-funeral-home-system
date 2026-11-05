import pool from '@/db';
import type { Rule } from '../types';
import {
  DECEASED_NAME_SQL,
  FINANCIALS_TAB_SQL,
  financialsLink,
  formatPeso,
} from './helpers';

/** How often a payment reminder repeats while a balance is outstanding. */
const PAYMENT_REMINDER_INTERVAL_DAYS = 7;

/** A full-payment notice is only raised for payments this recent. */
const FULL_PAYMENT_LOOKBACK_DAYS = 7;

/** A service-completed notice is only raised for cases completed this recently. */
const SERVICE_COMPLETED_LOOKBACK_DAYS = 7;

export const rules: Rule[] = [
  {
    // Resolves once the casket is restocked above its minimum.
    type: 'low_casket',
    audience: ['inventory_page'],
    resolvable: true,
    refresh: true,
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
    // Formalin is one stock overall. `formalininventory` is a ledger, so only
    // its latest row is the current stock; older rows are history and must not
    // keep the alert open. Resolves once a delivery brings stock back above the
    // minimum.
    type: 'low_formalin',
    audience: ['inventory_page'],
    resolvable: true,
    refresh: true,
    resolve: async (keys) => {
      await pool.query(
        `UPDATE notification SET resolvedat = now()
         WHERE type = 'low_formalin' AND resolvedat IS NULL
           AND NOT (dedupekey = ANY($1::text[]))`,
        [keys],
      );
      // Only ever keep one formalin reminder: drop older ones once stock runs
      // low again, and the per-ledger-row ones (`low_formalin:<formalinid>`)
      // this rule used to raise.
      await pool.query(
        `DELETE FROM notification
         WHERE type = 'low_formalin'
           AND (
             dedupekey <> 'low_formalin'
             OR notificationid < (
               SELECT MAX(notificationid) FROM notification
               WHERE type = 'low_formalin' AND dedupekey = 'low_formalin'
             )
           )`,
      );
    },
    collect: async () => {
      const result = await pool.query<{
        currentstock: number;
        minimumthreshold: number;
      }>(
        `SELECT currentstock, minimumthreshold
         FROM (
           SELECT currentstock, minimumthreshold
           FROM formalininventory
           ORDER BY date DESC, formalinid DESC
           LIMIT 1
         ) latest
         WHERE currentstock <= minimumthreshold`,
      );

      return result.rows.map((row) => ({
        dedupekey: 'low_formalin',
        title: 'Urgent: low formalin stock',
        message: `Formalin stock is at ${Number(row.currentstock)} liters (minimum ${Number(row.minimumthreshold)}). Restock as soon as possible.`,
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
         -- Rejected files are superseded (a rejection re-adds the requirement
         -- as a pending placeholder), so they don't block completion.
         WHERE d.verificationstatus <> 'rejected'
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
    // The payment event remains active until the case's service is completed.
    resolvable: true,
    refresh: true,
    resolve: async () => {
      await pool.query(
        `UPDATE notification n
         SET resolvedat = now()
         FROM deceasedrecord dr
         WHERE n.caseid = dr.caseid
           AND n.type = 'full_payment'
           AND n.resolvedat IS NULL
           AND dr.servicestatus = 'completed'`,
      );
    },
    collect: async () => {
      const result = await pool.query<{
        caseid: number;
        name: string;
        amount: number;
        tab: string;
      }>(
        `SELECT t.caseid, ${DECEASED_NAME_SQL} AS name, t.amount, ${FINANCIALS_TAB_SQL} AS tab
         FROM (
           SELECT DISTINCT ON (caseid) caseid, amount, remainingbalance, paymentdatetime
           FROM public.transaction
           WHERE transactionstatus = 'completed' AND paymentdatetime <= now()
           ORDER BY caseid, paymentdatetime DESC
         ) t
         JOIN deceasedrecord dr ON dr.caseid = t.caseid
         WHERE t.remainingbalance <= 0
           AND dr.servicestatus <> 'completed'
           AND t.paymentdatetime >= now() - make_interval(days => $1::int)`,
        [FULL_PAYMENT_LOOKBACK_DAYS],
      );

      return result.rows.map((row) => ({
        dedupekey: `full_payment:${row.caseid}`,
        title: 'Full payment received',
        message: `${row.name || `Case #${row.caseid}`} has been fully paid (final payment ${formatPeso(Number(row.amount))}).`,
        caseid: row.caseid,
        link: financialsLink(row.tab, row.name),
      }));
    },
  },
  {
    // Resolvable so the previous period's reminder (and any reminder for a
    // case that has since been paid off) is closed out when a newer one fires.
    type: 'payment_reminder',
    audience: ['financial_page'],
    resolvable: true,
    refresh: true,
    collect: async () => {
      const result = await pool.query<{
        caseid: number;
        name: string;
        remainingbalance: number;
        period: number;
        tab: string;
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
           ${FINANCIALS_TAB_SQL} AS tab,
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
        link: financialsLink(row.tab, row.name),
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
  {
    // `completedat` is stamped by a trigger whenever a case moves into
    // 'completed', so cases completed before it existed don't all fire at once.
    // Resolves if the case moves back out of 'completed'.
    type: 'service_completed',
    audience: ['case_page', 'financial_page'],
    resolvable: true,
    resolve: async () => {
      await pool.query(
        `UPDATE notification n
         SET resolvedat = now()
         FROM deceasedrecord dr
         WHERE n.caseid = dr.caseid
           AND n.type = 'service_completed'
           AND n.resolvedat IS NULL
           AND dr.servicestatus <> 'completed'`,
      );
    },
    collect: async () => {
      const result = await pool.query<{ caseid: number; name: string }>(
        `SELECT dr.caseid, ${DECEASED_NAME_SQL} AS name
         FROM deceasedrecord dr
         WHERE dr.servicestatus = 'completed'
           AND dr.completedat >= now() - make_interval(days => $1::int)`,
        [SERVICE_COMPLETED_LOOKBACK_DAYS],
      );

      return result.rows.map((row) => ({
        dedupekey: `service_completed:${row.caseid}`,
        title: 'Service completed',
        message: `The service for ${row.name || `case #${row.caseid}`} has been completed.`,
        caseid: row.caseid,
        link: '/dashboard/case-management',
      }));
    },
  },
  {
    // Raised by `notifyExpenseRecorded` when an expense is recorded, and
    // resolved when read (see the notifications routes). The sweep only
    // resolves ones whose expense or delivery has since been deleted.
    type: 'expense_recorded',
    audience: ['financial_page'],
    resolvable: true,
    resolve: async () => {
      await pool.query(
        `UPDATE notification n
         SET resolvedat = now()
         WHERE n.type = 'expense_recorded'
           AND n.resolvedat IS NULL
           AND NOT EXISTS (
             SELECT 1
             FROM (
               SELECT 'expense' AS source, expenseid AS id FROM expense
               UNION ALL
               SELECT 'casket', deliveryid FROM casketdelivery
               UNION ALL
               SELECT 'formalin', deliveryid FROM formalindelivery
             ) l
             WHERE n.dedupekey = 'expense_recorded:' || l.source || ':' || l.id
           )`,
      );
    },
    collect: async () => [],
  },
];
