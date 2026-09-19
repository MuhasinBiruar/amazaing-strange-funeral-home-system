import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import requireAuth from '@/middleware/require-auth';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { toExclusiveEndBound } from '@/util/date';
import { getDeliveriesQuerySchema, type Delivery } from 'shared';

const router = Router();

const SORT_COLUMNS: Record<keyof Delivery, string> = {
  deliveryid: 'd.deliveryid',
  source: 'd.source',
  item_type: 'd.item_type',
  quantityreceived: 'd.quantityreceived',
  deliverydate: 'd.deliverydate',
  totalamountpaid: 'd.totalamountpaid',
};

/**
 * `casketdelivery` + `formalindelivery` = `delivery`
 *
 * `quantityreceived` is cast to `double precision` on the casket side since
 * it's an `integer` there but a `double precision` on the formalin side.
 */
const DELIVERY_CTE = `
  WITH delivery AS (
    SELECT
      cd.deliveryid,
      'casket' AS source,
      'Casket, ' || cd.caskettype AS item_type,
      cd.quantityreceived::double precision AS quantityreceived,
      cd.deliverydate,
      cd.totalamountpaid
    FROM public.casketdelivery cd

    UNION ALL

    SELECT
      fd.deliveryid,
      'formalin' AS source,
      'Formalin' AS item_type,
      fd.quantityreceived,
      fd.deliverydate,
      fd.totalamountpaid
    FROM public.formalindelivery fd
  )
` as const;

/**
 * Sample URLs
 * `http://localhost:4000/deliveries`
 * `http://localhost:4000/deliveries?search=Mahogany`
 * `http://localhost:4000/deliveries?source=formalin`
 * `http://localhost:4000/deliveries?startDate=2026-01-01&endDate=2026-12-31`
 * `http://localhost:4000/deliveries?sortBy=totalamountpaid&sortOrder=desc&page=1&limit=20`
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
        source,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = getDeliveriesQuerySchema.parse(req.query);

      const selectClause = `
        SELECT
          d.deliveryid,
          d.source,
          d.item_type,
          d.quantityreceived,
          d.deliverydate,
          d.totalamountpaid
      `;

      const fromAndJoins = `FROM delivery d`;

      // Start building `whereClause`
      const whereConditions: string[] = [];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      if (source) {
        whereConditions.push(`d.source = $${paramIndex}`);
        queryParams.push(source);
        paramIndex++;
      }

      if (search) {
        // Searches through: delivery.item_type (e.g. "Casket, Mahogany", "Formalin")
        whereConditions.push(`d.item_type ILIKE $${paramIndex}`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`d.deliverydate >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`d.deliverydate < $${paramIndex}`);
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
            ${DELIVERY_CTE}
            ${selectClause}
            ${fromAndJoins}
            ${whereClause}
            ${orderByClause}
            ${paginationClause}
          `;

          const countQuery = `
            ${DELIVERY_CTE}
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

export default router;
