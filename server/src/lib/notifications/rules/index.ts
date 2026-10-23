import pool from '@/db';
import type { Rule } from '../types';
import { DECEASED_NAME_SQL, formatPeso } from './helpers';

/** How often a payment reminder repeats while a balance is outstanding. */
const PAYMENT_REMINDER_INTERVAL_DAYS = 7;

/** A full-payment notice is only raised for payments this recent. */
const FULL_PAYMENT_LOOKBACK_DAYS = 7;

export const rules: Rule[] = [
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
    // The payment event remains active until the case's service is completed.
    resolvable: true,
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
           AND dr.servicestatus <> 'completed'
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
