import pool from '@/db';
import type { NextFunction, Request, Response } from 'express';
import type { OfficialReceipt } from 'shared';

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
        o.pwd_discount::text AS pwd_discount
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
