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
  deliveryid: 'deliveryid',
  caskettype: 'caskettype',
  quantityreceived: 'quantityreceived',
  deliverydate: 'deliverydate',
  casketid: 'casketid',
  totalamountpaid: 'totalamountpaid',
};

/**
 * Sample URLs
 * `http://localhost:4000/deliveries/casket`
 * `http://localhost:4000/deliveries/casket?search=Mahogany`
 * `http://localhost:4000/deliveries/casket?startDate=2026-01-01&endDate=2026-12-31`
 * `http://localhost:4000/deliveries/casket?sortBy=totalamountpaid&sortOrder=asc&page=1&limit=20`
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, startDate, endDate, sortBy, sortOrder } =
        getCasketDeliveriesQuerySchema.parse(req.query);

      // Start building `whereClause`
      const whereConditions: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`caskettype ILIKE $${paramIndex}`);
        queryParams.push(`%${search}%`);
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
            SELECT * FROM casketdelivery
            ${whereClause}
            ${orderByClause}
            ${paginationClause}
          `;

          const countQuery = `
            SELECT COUNT(*) as total FROM casketdelivery
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
        'SELECT * FROM casketdelivery WHERE deliveryid = $1',
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
 * Records a casket delivery and, if it's linked to an inventory item,
 * increments that casket's stock by the quantity received.
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

      const delivery = await withTransaction(async (client) => {
        if (parsed.casketid !== null) {
          const casketResult = await client.query(
            `SELECT caskettype FROM casketinventory WHERE casketid = $1 FOR UPDATE`,
            [parsed.casketid],
          );
          if (casketResult.rows.length === 0) {
            throw new NotFoundError('Referenced casket does not exist.');
          }

          await client.query(
            `UPDATE casketinventory SET currentstock = currentstock + $1
             WHERE casketid = $2`,
            [parsed.quantityreceived, parsed.casketid],
          );
        }

        const deliveryResult = await client.query(
          `
          INSERT INTO casketdelivery (
            caskettype,
            quantityreceived,
            deliverydate,
            casketid,
            totalamountpaid
          ) VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
          [
            parsed.caskettype,
            parsed.quantityreceived,
            parsed.deliverydate,
            parsed.casketid,
            parsed.totalamountpaid,
          ],
        );

        return deliveryResult.rows[0];
      });

      res.locals.auditAction = `${res.locals.session.user.name} recorded a casket delivery: ${parsed.quantityreceived}x ${parsed.caskettype}`;

      res.status(201).json({
        data: delivery,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
