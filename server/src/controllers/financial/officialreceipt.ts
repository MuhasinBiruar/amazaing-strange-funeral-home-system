import pool from '@/db';
import { BadRequestError, NotFoundError } from '@/errors';
import { withTransaction } from '@/util/with-transaction';
import type { NextFunction, Request, Response } from 'express';
import type {
  CreateOfficialReceiptFromHistoryQuery,
  OfficialReceipt,
} from 'shared';

/** Every official receipt issued against a case, newest first. */
export async function getDirectOfficialReceipts(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await pool.query<OfficialReceipt>(
      `
      SELECT
        o.orid,
        o.ornumber,
        o.amount::text AS amount,
        o.issuedate,
        o.reissuancecount,
        o.transactionid,
        o.total_due::text AS total_due,
        o.withholding_tax::text AS withholding_tax,
        o.tin,
        o.discount_id,
        o.pwd_discount::text AS pwd_discount,
        o.payer_name
      FROM public.officialreceipt o
      JOIN public.transaction t ON t.transactionid = o.transactionid
      WHERE t.caseid = $1
      ORDER BY o.issuedate DESC, o.orid DESC
      `,
      [req.params.id],
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
}

/** Creates one receipt for the completed payments already recorded on a case. */
export async function createDirectOfficialReceiptFromHistory(
  req: Request<{ id: string }, {}, CreateOfficialReceiptFromHistoryQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const caseid = Number(req.params.id);
    const targetTransactionId = req.body.transactionid;
    const receipt = await withTransaction(async (client) => {
        const latestResult = await client.query<{
          transactionid: number;
          amount: string;
        }>(
          `
          SELECT transactionid, amount::text AS amount
          FROM public.transaction
          WHERE caseid = $1
            AND transactionstatus = 'completed'
            AND paymentcategory <> 'Refund'
            AND ($2::int IS NULL OR transactionid = $2)
          ORDER BY paymentdatetime DESC, transactionid DESC
          LIMIT 1
          FOR UPDATE
          `,
          [caseid, targetTransactionId ?? null],
        );

        const latestPayment = latestResult.rows[0];
        if (!latestPayment)
          throw new NotFoundError(
            targetTransactionId
              ? 'The selected payment was not found or is not eligible for an OR.'
              : 'No completed payment was found.',
          );

        const paymentResult = await client.query<{
          transactionid: number;
          amount: string;
          total_due: string;
        }>(
          `
          SELECT
            $1::int AS transactionid,
            CASE
              WHEN $3::boolean THEN $4::numeric
              ELSE COALESCE(SUM(
                CASE WHEN t.paymentcategory = 'Refund' THEN -t.amount ELSE t.amount END
              ), 0)
            END::text AS amount,
            c.totalamount::text AS total_due
          FROM public.transaction t
          JOIN public.contract c ON c.caseid = t.caseid
          WHERE t.caseid = $2
            AND t.transactionstatus = 'completed'
          GROUP BY c.totalamount
          `,
          [
            latestPayment.transactionid,
            caseid,
            targetTransactionId !== undefined,
            latestPayment.amount,
          ],
        );
        const payment = paymentResult.rows[0];
        if (Number(payment.amount) <= 0)
          throw new BadRequestError(
            'The payment history has no amount to receipt.',
          );

        const existing = await client.query(
          `SELECT 1 FROM public.officialreceipt o
           JOIN public.transaction t ON t.transactionid = o.transactionid
           WHERE t.caseid = $1
             AND ($2::int IS NULL OR t.transactionid = $2)
           LIMIT 1`,
          [caseid, targetTransactionId ?? null],
        );
        if (existing.rows.length > 0)
          throw new BadRequestError(
            targetTransactionId
              ? 'An official receipt already exists for this payment.'
              : 'An official receipt already exists for this case.',
          );

        try {
          const inserted = await client.query<OfficialReceipt>(
            `INSERT INTO public.officialreceipt (
              ornumber, amount, issuedate, transactionid, total_due, payer_name
            ) VALUES ($1, $2, NOW(), $3, $4, $5)
             RETURNING
               orid, ornumber, amount::text AS amount, issuedate, reissuancecount,
               transactionid, total_due::text AS total_due,
               withholding_tax::text AS withholding_tax, tin, discount_id,
               pwd_discount::text AS pwd_discount, payer_name`,
            [
              req.body.ornumber,
              payment.amount,
              payment.transactionid,
              payment.total_due,
              req.body.payer_name,
            ],
          );
          return inserted.rows[0];
        } catch (error) {
          if ((error as { code?: string }).code === '23505')
            throw new BadRequestError('That OR number is already used.');
          throw error;
        }
    });

    res.status(201).json({ data: receipt });
  } catch (error) {
    next(error);
  }
}
