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
import { NotFoundError } from '@/errors';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { toExclusiveEndBound } from '@/util/date';
import {
  createCasketDeliveryQuerySchema,
  getCasketDeliveriesQuerySchema,
  type CasketDelivery,
  type CreateCasketDeliveryQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';
import { withTransaction } from '@/util/with-transaction';

const router = Router();

const SORT_COLUMNS: Record<keyof CasketDelivery, string> = {
  deliveryid: 'cd.deliveryid',
  quantityreceived: 'cd.quantityreceived',
  deliverydate: 'cd.deliverydate',
  casketid: 'cd.casketid',
  totalamountpaid: 'cd.totalamountpaid',
  caskettype: 'ci.caskettype',
  caskettier: 'ci.caskettier',
  unitcost: 'unitcost',
};

/**
 * `casketdelivery` only stores `casketid`, so the casket's type and tier come
 * from `casketinventory` (`casketid` is nullable, hence the `LEFT JOIN`).
 */
const SELECT_CASKET_DELIVERY = `
  SELECT
    cd.deliveryid,
    cd.quantityreceived,
    cd.deliverydate,
    cd.casketid,
    cd.totalamountpaid,
    ci.caskettype,
    ci.caskettier,
    cd.totalamountpaid / NULLIF(cd.quantityreceived, 0) AS unitcost
  FROM public.casketdelivery cd
  LEFT JOIN public.casketinventory ci ON ci.casketid = cd.casketid
` as const;

/**
 * Sample URLs
 * `http://localhost:4000/deliveries/casket`
 * `http://localhost:4000/deliveries/casket?search=Mahogany`
 * `http://localhost:4000/deliveries/casket?tier=High%20End`
 * `http://localhost:4000/deliveries/casket?startDate=2026-01-01&endDate=2026-12-31`
 * `http://localhost:4000/deliveries/casket?sortBy=totalamountpaid&sortOrder=asc&page=1&limit=20`
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page,
        limit,
        search,
        tier,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = getCasketDeliveriesQuerySchema.parse(req.query);

      // Start building `whereClause`
      const whereConditions: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      if (search) {
        // Searches through: casketinventory.caskettype, casketinventory.caskettier
        whereConditions.push(
          `(ci.caskettype ILIKE $${paramIndex} OR ci.caskettier ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (tier) {
        whereConditions.push(`ci.caskettier = $${paramIndex}`);
        queryParams.push(tier);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`cd.deliverydate >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`cd.deliverydate < $${paramIndex}`);
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
            ${SELECT_CASKET_DELIVERY}
            ${whereClause}
            ${orderByClause}, cd.deliveryid DESC
            ${paginationClause}
          `;

          const countQuery = `
            SELECT COUNT(*) as total
            FROM public.casketdelivery cd
            LEFT JOIN public.casketinventory ci ON ci.casketid = cd.casketid
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
        `${SELECT_CASKET_DELIVERY} WHERE cd.deliveryid = $1`,
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
 * Records a casket delivery and increments that casket's stock by the
 * quantity received, in one transaction.
 *
 * @remarks
 * Responds with a `warning` when the casket is still at or below its minimum
 * threshold even after the delivery.
 */
router.post(
  '/',
  requireAuth,
  validate(createCasketDeliveryQuerySchema),
  async (
    req: Request<{}, {}, CreateCasketDeliveryQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;

      const { delivery, warning } = await withTransaction(async (client) => {
        const casketResult = await client.query(
          `UPDATE casketinventory SET currentstock = currentstock + $1
           WHERE casketid = $2
           RETURNING caskettype, currentstock, minimumthreshold`,
          [parsed.quantityreceived, parsed.casketid],
        );
        if (casketResult.rows.length === 0) {
          throw new NotFoundError('Referenced casket does not exist.');
        }

        const casket = casketResult.rows[0];
        const warning =
          casket.currentstock <= casket.minimumthreshold
            ? `${casket.caskettype} is still at or below its minimum threshold (${casket.currentstock} in stock, minimum ${casket.minimumthreshold}).`
            : null;

        const insertResult = await client.query(
          `
          INSERT INTO casketdelivery (
            quantityreceived,
            deliverydate,
            casketid,
            totalamountpaid
          ) VALUES ($1, $2, $3, $4) RETURNING deliveryid;`,
          [
            parsed.quantityreceived,
            parsed.deliverydate,
            parsed.casketid,
            parsed.totalamountpaid,
          ],
        );

        const deliveryResult = await client.query(
          `${SELECT_CASKET_DELIVERY} WHERE cd.deliveryid = $1`,
          [insertResult.rows[0].deliveryid],
        );

        return { delivery: deliveryResult.rows[0], warning };
      });

      res.locals.auditAction = `${res.locals.session.user.name} recorded a casket delivery: ${parsed.quantityreceived}x ${delivery.caskettype}`;

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
