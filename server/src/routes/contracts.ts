import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import requireAuth from '@/middleware/require-auth.ts';
import {
  contractQuerySchema,
  contractSchema,
  type ContractSchema,
} from '@/schemas/contract.ts';
import type { PostgresValue } from '@/types/db.ts';
import { NotFoundError } from '@/errors/http-errors.ts';
import validate from '@/middleware/validate.ts';
import { withRepeatableRead } from '@/util/with-repeatable-read.ts';

const router = Router();

/**
 * `GET /contracts?search=casket&sortBy=signeddate&sortDir=asc&page=1&limit=50`
 *
 * `search=...` searches through `inclusions` & `contractid`
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = contractQuerySchema.parse(req.query);
      const result = await withRepeatableRead(async (client) => {
        const conditions: string[] = [];
        const queryParams: PostgresValue[] = [];

        if (parsed.search) {
          conditions.push(
            `(inclusions ILIKE $${queryParams.length + 1} OR contractid::text ILIKE $${queryParams.length + 1})`,
          );
          queryParams.push(`%${parsed.search}%`);
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const dataQuery = `
          SELECT * FROM contract
          ${whereClause}
          ORDER BY ${parsed.sortBy} ${parsed.sortDir}, contractid ASC
          LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        const dataResult = await client.query(dataQuery, [
          ...queryParams,
          parsed.limit,
          (parsed.page - 1) * parsed.limit,
        ]);

        const countQuery = `SELECT COUNT(*) FROM contract ${whereClause}`;
        const countResult = await client.query(countQuery, queryParams);

        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / parsed.limit);

        return {
          data: dataResult.rows,
          meta: {
            page: parsed.page,
            limit: parsed.limit,
            totalItems,
            totalPages,
            hasNextPage: parsed.page < totalPages,
            hasPreviousPage: parsed.page > 1,
          },
        };
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM contract WHERE contractid = $1',
      [id],
    );

    if (result.rows.length === 0) throw new NotFoundError();

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(contractSchema),
  async (
    req: Request<{}, {}, ContractSchema>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
        INSERT INTO contract (
          signeddate,
          burialdatedeadline,
          totalamount,
          embalmingperiod,
          inclusions,
          caseid,
          packageid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING contractid;`,
        [
          parsed.signeddate,
          parsed.burialdatedeadline,
          parsed.totalamount,
          parsed.embalmingperiod,
          parsed.inclusions,
          parsed.caseid,
          parsed.packageid,
        ],
      );

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
