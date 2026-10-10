import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import requireAuth from '@/middleware/require-auth';
import { BadRequestError, NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { toExclusiveEndBound } from '@/util/date';
import {
  createFormalinDeliveryQuerySchema,
  getFormalinDeliveriesQuerySchema,
  type FormalinDelivery,
  type CreateFormalinDeliveryQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';
import { withTransaction } from '@/util/with-transaction';

const router = Router();

const SORT_COLUMNS: Record<keyof FormalinDelivery, string> = {
  deliveryid: 'deliveryid',
  quantityreceived: 'quantityreceived',
  deliverydate: 'deliverydate',
  formalinid: 'formalinid',
  totalamountpaid: 'totalamountpaid',
  unitcost: 'unitcost',
};

const SELECT_FORMALIN_DELIVERY = `
  SELECT
    deliveryid,
    quantityreceived,
    deliverydate,
    formalinid,
    totalamountpaid,
    totalamountpaid / NULLIF(quantityreceived, 0) AS unitcost
  FROM public.formalindelivery
` as const;

/**
 * Sample URLs
 * `http://localhost:4000/deliveries/formalin`
 * `http://localhost:4000/deliveries/formalin?search=50`
 * `http://localhost:4000/deliveries/formalin?startDate=2026-01-01&endDate=2026-12-31`
 * `http://localhost:4000/deliveries/formalin?sortBy=totalamountpaid&sortOrder=asc&page=1&limit=20`
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, startDate, endDate, sortBy, sortOrder } =
        getFormalinDeliveriesQuerySchema.parse(req.query);

      // Start building `whereClause`
      const whereConditions: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      // Searches through: formalindelivery.quantityreceived. Anything that
      // isn't part of a number (e.g. a trailing "L") is ignored, so "50 L"
      // and "50" search the same.
      const quantitySearch = search?.replace(/[^\d.]/g, '');
      if (quantitySearch) {
        whereConditions.push(`quantityreceived::text ILIKE $${paramIndex}`);
        queryParams.push(`%${quantitySearch}%`);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`deliverydate >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`deliverydate < $${paramIndex}`);
        queryParams.push(toExclusiveEndBound(endDate));
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
            ${SELECT_FORMALIN_DELIVERY}
            ${whereClause}
            ${orderByClause}, deliveryid DESC
            ${paginationClause}
          `;

          const countQuery = `
            SELECT COUNT(*) as total FROM formalindelivery
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

      const totalRecords = parseInt(countResult.rows[0].total, 10);
      res.json({
        data: dataResult.rows,
        meta: {
          total: totalRecords,
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as IdParam;
      const result = await pool.query(
        `${SELECT_FORMALIN_DELIVERY} WHERE deliveryid = $1`,
        [id],
      );
      if (result.rows.length === 0) throw new NotFoundError();

      res.json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Records a formalin delivery and adds it to the current stock.
 *
 * @remarks
 * Formalin stock is a ledger: the newest `formalininventory` row (by `date`,
 * then `formalinid`) is the current stock, and every change appends a new row
 * rather than editing an old one — the same as adding stock or recording
 * usage in `routes/formalininventory.ts`. So this locks the newest row, appends
 * a row with the delivery added (keeping the same minimum threshold), and
 * links the delivery to that new row.
 *
 * The new row's `date` is when the delivery was *recorded* (`now()`), not
 * `deliverydate`, so a back-dated delivery can't sort below the current stock.
 *
 * Responds with a `warning` when stock is still at or below the minimum.
 */
router.post(
  '/',
  requireAuth,
  validate(createFormalinDeliveryQuerySchema),
  async (
    req: Request<{}, {}, CreateFormalinDeliveryQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;

      const { delivery, warning } = await withTransaction(async (client) => {
        const latestResult = await client.query(
          `SELECT currentstock, minimumthreshold
           FROM formalininventory
           ORDER BY date DESC, formalinid DESC
           LIMIT 1
           FOR UPDATE`,
        );
        if (latestResult.rows.length === 0) {
          throw new BadRequestError(
            'Formalin inventory has not been initialized.',
          );
        }

        const latest = latestResult.rows[0];
        const newStock = Number(latest.currentstock) + parsed.quantityreceived;
        const minimum = Number(latest.minimumthreshold);

        const inventoryResult = await client.query(
          `INSERT INTO formalininventory (currentstock, minimumthreshold, date)
           VALUES ($1, $2, now())
           RETURNING formalinid`,
          [newStock, minimum],
        );

        const deliveryResult = await client.query(
          `
          INSERT INTO formalindelivery (
            quantityreceived,
            deliverydate,
            formalinid,
            totalamountpaid
          ) VALUES ($1, $2, $3, $4)
          RETURNING *, totalamountpaid / NULLIF(quantityreceived, 0) AS unitcost;`,
          [
            parsed.quantityreceived,
            parsed.deliverydate,
            inventoryResult.rows[0].formalinid,
            parsed.totalamountpaid,
          ],
        );

        return {
          delivery: deliveryResult.rows[0],
          warning:
            newStock <= minimum
              ? `Formalin stock is still at or below the minimum threshold (${newStock} liters, minimum ${minimum}).`
              : null,
        };
      });

      res.locals.auditAction = `${res.locals.session.user.name} recorded a formalin delivery of ${parsed.quantityreceived} liters`;

      res.status(201).json({
        data: delivery,
        warning,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
