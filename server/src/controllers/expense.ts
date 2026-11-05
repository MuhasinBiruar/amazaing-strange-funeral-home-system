import pool from '@/db';
import type { Locals } from '@/types/controllers';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { toExclusiveEndBound } from '@/util/date';
import type { NextFunction, Request, Response } from 'express';
import {
  getExpenseLogQuerySchema,
  type CreateExpenseQuery,
  type ExpenseLog,
  type GetExpenseLogResponse,
} from 'shared';

export const createExpense = async (
  req: Request<{}, {}, CreateExpenseQuery>,
  res: Response<{}, Locals>,
  next: NextFunction,
) => {
  try {
    const { description, amount, expensedate } = req.body;
    const result = await pool.query(
      `INSERT INTO public.expense (description, amount, expensedate, recordedby)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
      [description, amount, expensedate, res.locals.session.user.id],
    );

    res.locals.auditAction = `${res.locals.session.user.name} created an expense record ${description} with amount ${amount}.`;

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const SORT_COLUMNS: Record<keyof ExpenseLog, string> = {
  source: 'l.source',
  id: 'l.id',
  description: 'l.description',
  amount: 'l.amount',
  expensedate: 'l.expensedate',
  recordedby: 'l.recordedby',
  staff_name: 'l.staff_name',
};

/**
 * `expense` + `casketdelivery` + `formalindelivery` = `expense_log`
 *
 * Deliveries are listed with what was paid for them; ones with nothing paid
 * aren't a cost, so they're left out. `amount` is cast to `numeric` on every
 * side so it comes back as the same numeric string `expense.amount` does.
 */
const EXPENSE_LOG_CTE = `
  WITH expense_log AS (
    SELECT
      'expense' AS source,
      e.expenseid AS id,
      e.description,
      e.amount::numeric AS amount,
      e.expensedate,
      e.recordedby,
      s.name AS staff_name
    FROM public.expense e
    LEFT JOIN public.staff s ON e.recordedby = s.id

    UNION ALL

    SELECT
      'casket' AS source,
      cd.deliveryid AS id,
      'Casket delivery: ' || cd.quantityreceived || 'x ' ||
        COALESCE(ci.caskettype, 'unlinked casket') AS description,
      cd.totalamountpaid::numeric AS amount,
      cd.deliverydate AS expensedate,
      cd.recordedby,
      cs.name AS staff_name
    FROM public.casketdelivery cd
    LEFT JOIN public.casketinventory ci ON ci.casketid = cd.casketid
    LEFT JOIN public.staff cs ON cd.recordedby = cs.id
    WHERE cd.totalamountpaid > 0

    UNION ALL

    SELECT
      'formalin' AS source,
      fd.deliveryid AS id,
      'Formalin delivery: ' || fd.quantityreceived || ' L' AS description,
      fd.totalamountpaid::numeric AS amount,
      fd.deliverydate AS expensedate,
      fd.recordedby,
      fs.name AS staff_name
    FROM public.formalindelivery fd
    LEFT JOIN public.staff fs ON fd.recordedby = fs.id
    WHERE fd.totalamountpaid > 0
  )
` as const;

/**
 * Sample URLs
 * `http://localhost:4000/expenses`
 * `http://localhost:4000/expenses?source=casket`
 * `http://localhost:4000/expenses?search=Mahogany&sortBy=amount&sortOrder=desc`
 */
export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page,
      limit,
      search,
      source,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = getExpenseLogQuerySchema.parse(req.query);

    const selectClause = `
      SELECT
        l.source,
        l.id,
        l.description,
        l.amount,
        l.expensedate,
        l.recordedby,
        l.staff_name
    `;

    const fromAndJoins = `FROM expense_log l`;

    // Start building `whereClause`
    const whereConditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`l.expensedate >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`l.expensedate < $${paramIndex}`);
      queryParams.push(toExclusiveEndBound(endDate));
      paramIndex++;
    }

    if (source) {
      whereConditions.push(`l.source = $${paramIndex}`);
      queryParams.push(source);
      paramIndex++;
    }

    if (search) {
      // Searches through: description (incl. delivery item names), staff name
      whereConditions.push(`(
        l.description ILIKE $${paramIndex} OR
        l.staff_name ILIKE $${paramIndex}
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
            ${EXPENSE_LOG_CTE}
            ${selectClause}
            ${fromAndJoins}
            ${whereClause}
            ${orderByClause}, l.source, l.id DESC
            ${paginationClause}
          `;

        const countQuery = `
            ${EXPENSE_LOG_CTE}
            SELECT COUNT(*) as total
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
    } satisfies GetExpenseLogResponse);
  } catch (error) {
    next(error);
  }
};
