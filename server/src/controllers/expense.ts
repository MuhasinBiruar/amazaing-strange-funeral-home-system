import pool from '@/db';
import type { Locals } from '@/types/controllers';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import {
  getExpensesQuerySchema,
  type CreateExpenseQuery,
  type GetExpensesResponse,
  type GetExpensesRow,
} from 'shared';

export const createExpense = async (
  req: Request<{}, {}, CreateExpenseQuery>,
  res: Response<{}, Locals>,
  next: NextFunction,
) => {
  try {
    const { description, amount } = req.body;
    // TODO: Make expensedate editable
    const result = await pool.query(
      `INSERT INTO public.expense (description, amount, expensedate, recordedby)
        VALUES ($1, $2, NOW(), $3)
        RETURNING *`,
      [description, amount, res.locals.session.user.id],
    );

    res.locals.auditAction = `${res.locals.session.user.name} created an expense record ${description} with amount ${amount}.`;

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const SORT_COLUMNS: Record<keyof GetExpensesRow, string> = {
  expenseid: 'e.expenseid',
  description: 'e.description',
  amount: 'e.amount',
  expensedate: 'e.expensedate',
  recordedby: 'e.recordedby',
  staff_name: 's.name',
};

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getExpensesQuerySchema.parse(req.query);

    const selectClause = `
      SELECT
        e.expenseid,
        e.description,
        e.amount,
        e.expensedate,
        e.recordedby,
        s.name AS staff_name
    `;

    const fromAndJoins = `
      FROM public.expense e
      LEFT JOIN public.staff s ON e.recordedby = s.id
    `;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      // Searches through: expense.description, staff.name
      whereConditions.push(`(
        e.description ILIKE $${paramIndex} OR
        s.name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
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
            SELECT COUNT(e.expenseid) as total
            ${fromAndJoins}
            ${whereClause}
          `;

        return await Promise.all([
          client.query(dataQuery, [
            ...queryParams,
            ...[limit, (page - 1) * limit],
          ]),
          client.query(countQuery, queryParams),
        ]);
      },
    );

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    } satisfies GetExpensesResponse);
  } catch (error) {
    next(error);
  }
};
