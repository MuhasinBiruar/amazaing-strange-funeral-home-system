import type { NextFunction, Request, Response } from 'express';
import pool from '@/db';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { NotFoundError } from '@/errors';
import { getDeceasedName } from '@/util/audit-log';
import {
  createTransactionSchema,
  dayTransactionsQuerySchema,
  type CreateTransactionInput,
} from 'shared';

const toExclusiveEndBound = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export async function getDayTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { startDate, endDate } = dayTransactionsQuerySchema.parse(req.query);
    const exclusiveEnd = toExclusiveEndBound(endDate);

    const result = await pool.query(
      `
      SELECT * FROM (
        SELECT
          t.transactionid::text AS id,
          'transaction'::text AS source,
          t.amount::numeric AS amount,
          (CASE WHEN t.paymentcategory = 'Refund' THEN 'out' ELSE 'in' END)::text AS direction,
          t.caseid::int AS caseid,
          CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, ''))::text AS deceased_name,
          t.paymentcategory::text AS category,
          t.paymentdatetime::timestamp AS datetime
        FROM public.transaction t
        LEFT JOIN public.deceasedrecord dr ON t.caseid = dr.caseid
        WHERE t.transactionstatus = 'completed'
          AND t.paymentdatetime >= $1 AND t.paymentdatetime < $2

        UNION ALL

        SELECT
          cd.deliveryid::text AS id,
          'casket'::text AS source,
          cd.totalamountpaid::numeric AS amount,
          'out'::text AS direction,
          NULL::int AS caseid,
          NULL::text AS deceased_name,
          'Casket delivery'::text AS category,
          cd.deliverydate::timestamp AS datetime
        FROM public.casketdelivery cd
        WHERE cd.deliverydate >= $1 AND cd.deliverydate < $2

        UNION ALL

        SELECT
          fd.deliveryid::text AS id,
          'formalin'::text AS source,
          fd.totalamountpaid::numeric AS amount,
          'out'::text AS direction,
          NULL::int AS caseid,
          NULL::text AS deceased_name,
          'Formalin delivery'::text AS category,
          fd.deliverydate::timestamp AS datetime
        FROM public.formalindelivery fd
        WHERE fd.deliverydate >= $1 AND fd.deliverydate < $2

        UNION ALL

        SELECT
          e.expenseid::text AS id,
          'expense'::text AS source,
          e.amount::numeric AS amount,
          'out'::text AS direction,
          NULL::int AS caseid,
          NULL::text AS deceased_name,
          ('Expense - ' || e.description)::text AS category,
          e.expensedate::timestamp AS datetime
        FROM public.expense e
        WHERE e.expensedate >= $1 AND e.expensedate < $2
      ) combined
      ORDER BY datetime DESC
      `,
      [startDate, exclusiveEnd],
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
} 
// 2. Create a New Case Transaction (The new one)
export async function createCaseTransaction(
  req: Request<{ id: string }, {}, CreateTransactionInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const caseIdNum = parseInt(id, 10);
    const parsed = createTransactionSchema.parse(req.body);

    const transaction = await withRepeatableRead(async (client) => {
      const contractRes = await client.query(
        'SELECT totalamount FROM public.contract WHERE caseid = $1',
        [caseIdNum],
      );

      if (contractRes.rows.length === 0) {
        throw new NotFoundError(`No contract found for case ID ${caseIdNum}`);
      }

      const totalAmount = Number(contractRes.rows[0].totalamount);

      const paidRes = await client.query(
        `
        SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory <> 'Refund'
          ), 0)
          - COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory = 'Refund'
          ), 0) AS totalpaid
        FROM public.transaction
        WHERE caseid = $1
        `,
        [caseIdNum],
      );

      const currentPaid = Number(paidRes.rows[0].totalpaid);
      const newPaid =
        parsed.paymentcategory === 'Refund'
          ? currentPaid - parsed.amount
          : currentPaid + parsed.amount;

      const remainingBalance = Math.max(0, totalAmount - newPaid);

      const insertRes = await client.query(
        `
        INSERT INTO public.transaction (
          amount, paymentdatetime, paymentmethod, paymentcategory, remainingbalance, transactionstatus, caseid
        ) VALUES ($1, NOW(), $2, $3, $4, 'completed', $5)
        RETURNING *;
        `,
        [parsed.amount, parsed.paymentmethod, parsed.paymentcategory, remainingBalance, caseIdNum]
      );

      const newTransaction = insertRes.rows[0];

      if (parsed.orNumber) {
        await client.query(
          `
          INSERT INTO public.officialreceipt (ornumber, amount, issuedate, reissuancecount, transactionid)
          VALUES ($1, $2, CURRENT_DATE, 0, $3);
          `,
          [parsed.orNumber, parsed.amount, newTransaction.transactionid]
        );
      }

      return newTransaction;
    });

    const deceasedName = await getDeceasedName(caseIdNum);
    res.locals.auditAction = `${res.locals.session.user.name} recorded a ${parsed.paymentcategory} of ₱${parsed.amount} via ${parsed.paymentmethod} for ${deceasedName} (Case #${id})`;

    res.status(201).json({ data: transaction });
  } catch (error) {
    next(error);
  }
}

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT * FROM public.expense 
      ORDER BY expensedate DESC, expenseid DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const parsed = req.body; // Assume validated by middleware
    const result = await pool.query(
      `INSERT INTO public.expense (description, amount, expensedate, recordedby)
       VALUES ($1, $2, CURRENT_DATE, $3)
       RETURNING *`,
      [parsed.description, parsed.amount, parsed.recordedby || 'Staff']
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Failed to create expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};