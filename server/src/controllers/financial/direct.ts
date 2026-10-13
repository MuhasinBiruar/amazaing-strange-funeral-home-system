import pool from '@/db';
import type { Locals } from '@/types/controllers';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import {
  DirectPlan,
  getDirectPlansQuerySchema,
  type GetDirectPlansResponse,
  type Transaction,
  type CreateTransactionQuery,
} from 'shared';
import BigNumber from 'bignumber.js';
import { BadRequestError, NotFoundError } from '@/errors';
import { getDeceasedName } from '@/util/audit-log';
import { withTransaction } from '@/util/with-transaction';

const SORT_COLUMNS: Record<string, string> = {
  caseid: 'dr.caseid',
  deceased_name: 'deceased_name',
  representativeid: 'dr.representedby',
  representative_name: 'representative_name',
  contractid: 'c.contractid',
  totalamount: 'c.totalamount',
  totalamountpaid: 'totalamountpaid',
};

export async function getDirect(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getDirectPlansQuerySchema.parse(req.query);

    const selectClause = `
      SELECT
        dr.caseid,
        CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS deceased_name,
        dr.representedby AS representativeid,
        CONCAT_WS(' ', NULLIF(r.firstname, ''), NULLIF(r.middlename, ''), NULLIF(r.lastname, '')) AS representative_name,
        c.contractid,
        c.totalamount,
        COALESCE(t.totalpaid, 0) AS totalamountpaid
    `;

    const fromAndJoins = `
      FROM public.deceasedrecord dr
      LEFT JOIN public.representative r ON dr.representedby = r.representativeid
      LEFT JOIN public.contract c ON dr.caseid = c.caseid
      LEFT JOIN (
        SELECT
          caseid,
          COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory <> 'Refund'
          ), 0)
          - COALESCE(SUM(amount) FILTER (
            WHERE transactionstatus = 'completed' AND paymentcategory = 'Refund'
          ), 0) AS totalpaid
        FROM public.transaction
        GROUP BY caseid
      ) t ON dr.caseid = t.caseid
    `;

    // Start building `whereClause`
    const whereConditions: string[] = [`dr.plantype = 'Direct'`];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: deceasedrecord.name, representative.name
      whereConditions.push(`(
        CONCAT_WS(' ', dr.firstname, dr.middlename, dr.lastname) ILIKE $${paramIndex} OR
        CONCAT_WS(' ', r.firstname, r.middlename, r.lastname) ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    // Finish building `whereClause`

    const orderByClause = `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;
    const paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const [dataResult, countResult] = await withRepeatableRead(
      async (client) => {
        const dataQuery = `
          ${selectClause}
          ${fromAndJoins}
          ${whereClause}
          ${orderByClause}
          ${paginationClause}
        `;

        const countQuery = `
          SELECT COUNT(dr.caseid) as total
          ${fromAndJoins}
          ${whereClause}
        `;

        return await Promise.all([
          client.query<DirectPlan>(dataQuery, [
            ...queryParams,
            ...[limit, (page - 1) * limit],
          ]),
          client.query<{ total: string }>(countQuery, queryParams),
        ]);
      },
    );

    const totalRecords = parseInt(countResult.rows[0].total, 10);
    res.json({
      data: dataResult.rows,
      meta: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    } satisfies GetDirectPlansResponse);
  } catch (error) {
    next(error);
  }
}

export async function getDirectTransactions(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const result = await pool.query<Transaction>(
      `
      SELECT
        transactionid,
        amount::text AS amount,
        paymentdatetime,
        paymentmethod,
        paymentcategory,
        remainingbalance::text AS remainingbalance,
        transactionstatus,
        caseid
      FROM public.transaction
      WHERE caseid = $1
      ORDER BY paymentdatetime DESC
      `,
      [id],
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Records a payment (or refund) against a Direct case and stores the balance
 * remaining on the contract after it.
 */
export async function createDirectTransaction(
  req: Request<{ id: string }, {}, CreateTransactionQuery, {}, Locals>,
  res: Response<{}, Locals>,
  next: NextFunction,
) {
  try {
    const caseid = Number(req.params.id);
    const { amount, paymentdatetime, paymentmethod, paymentcategory } =
      req.body;

    const delta =
      paymentcategory === 'Refund'
        ? new BigNumber(amount).negated()
        : new BigNumber(amount);

    const transaction = await withTransaction(async (client) => {
      const caseResult = await client.query<{
        plantype: string;
        totalamount: string | null;
      }>(
        `SELECT dr.plantype, c.totalamount::text AS totalamount
         FROM public.deceasedrecord dr
         LEFT JOIN public.contract c ON c.caseid = dr.caseid
         WHERE dr.caseid = $1
         FOR UPDATE OF dr`,
        [caseid],
      );

      if (caseResult.rows.length === 0)
        throw new NotFoundError('Case not found.');

      const { plantype, totalamount } = caseResult.rows[0];
      if (plantype !== 'Direct')
        throw new BadRequestError(
          'Payments can only be recorded here for Direct cases.',
        );
      if (totalamount === null)
        throw new BadRequestError(
          'This case has no contract yet, so there is nothing to pay against.',
        );

      const paidResult = await client.query<{ paid: string }>(
        `SELECT COALESCE(SUM(
           CASE WHEN paymentcategory = 'Refund' THEN -amount ELSE amount END
         ), 0)::text AS paid
         FROM public.transaction
         WHERE caseid = $1 AND transactionstatus = 'completed'`,
        [caseid],
      );

      const newPaid = new BigNumber(paidResult.rows[0].paid).plus(delta);
      const remaining = new BigNumber(totalamount).minus(newPaid);

      if (newPaid.isLessThan(0))
        throw new BadRequestError('Refund is larger than the amount paid.');
      if (remaining.isLessThan(0))
        throw new BadRequestError(
          `Payment is larger than the remaining balance (${remaining
            .plus(delta)
            .toFixed(2)}).`,
        );

      const insertResult = await client.query<Transaction>(
        `INSERT INTO public.transaction (
           amount,
           paymentdatetime,
           paymentmethod,
           paymentcategory,
           remainingbalance,
           transactionstatus,
           caseid
         ) VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, 'completed', $6)
         RETURNING
           transactionid,
           amount::text AS amount,
           paymentdatetime,
           paymentmethod,
           paymentcategory,
           remainingbalance::text AS remainingbalance,
           transactionstatus,
           caseid`,
        [
          amount,
          paymentdatetime,
          paymentmethod,
          paymentcategory,
          remaining.toFixed(),
          caseid,
        ],
      );

      return insertResult.rows[0];
    });

    const deceasedName = await getDeceasedName(caseid);
    res.locals.auditAction = `${res.locals.session.user.name} recorded a ${paymentcategory} of ${amount} for ${deceasedName}`;

    res.status(201).json({ data: transaction });
  } catch (error) {
    next(error);
  }
}
