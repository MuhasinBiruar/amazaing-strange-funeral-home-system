import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import requireAuth from '@/middleware/require-auth.ts';
import { contractQuerySchema } from '@/schemas/contract.ts';
import type { PostgresValue } from '@/types/db.ts';

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

      const result = await pool.query(
        `
        SELECT * FROM contract
        ${whereClause}
        ORDER BY ${parsed.sortBy} ${parsed.sortDir}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, parsed.limit, (parsed.page - 1) * parsed.limit],
      );

      const countQuery = `SELECT COUNT(*) FROM contract ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams);
      const totalItems = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalItems / parsed.limit);
      res.json({
        data: result.rows,
        meta: {
          page: parsed.page,
          limit: parsed.limit,
          totalItems,
          totalPages,
          hasNextPage: parsed.page < totalPages,
          hasPreviousPage: parsed.page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
