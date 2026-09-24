import { Router, type Request } from 'express';
import { getPaginatedCasketInventoryQuerySchema } from 'shared';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';

const router = Router();

const SORT_COLUMNS = {
  casketid: 'casketid',
  caskettype: 'caskettype',
  currentstock: 'currentstock',
} as const;

router.get('/paginated', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, sortOrder } =
      getPaginatedCasketInventoryQuerySchema.parse(req.query);
    const queryParams: unknown[] = [];
    const whereConditions: string[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(
        casketid::text ILIKE $1 OR
        caskettype ILIKE $1 OR
        currentstock::text ILIKE $1
      )`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';
    const limitParam = queryParams.length + 1;
    const offsetParam = queryParams.length + 2;
    const orderBy = SORT_COLUMNS[sortBy];
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `
          SELECT casketid, caskettype, currentstock
          FROM casketinventory
          ${whereClause}
          ORDER BY ${orderBy} ${direction}
          LIMIT $${limitParam} OFFSET $${offsetParam}
        `,
        [...queryParams, limit, (page - 1) * limit],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM casketinventory ${whereClause}`,
        queryParams,
      ),
    ]);

    const [{ total }] = countResult.rows;
    res.json({
      data: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @description Get all packages for a specific casket
 * @param casketid - The ID of the casket
 * @returns A list of packages for the specified casket
 **/
router.get(
  '/casket/:casketid/packages',
  requireAuth,
  async (req: Request<{ casketid: string }>, res, next) => {
    try {
      const casketId = parseInt(req.params.casketid, 10);
      const result = await pool.query(
        `
      SELECT
        p.packageid,
        p.casketid,
        p.packagename,
        p.packagetype,
        p.price,
        p.embalmingperiod,
        p.inclusions,
        c.caskettype,
        c.currentstock AS casket_currentstock
    FROM package AS p
    JOIN casketinventory AS c
      ON c.casketid = p.casketid
      WHERE p.casketid = $1
      ORDER BY p.packageid;
      `,
        [casketId],
      );
      res.json({
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/casket/:casketid/deliveryhistory',
  requireAuth,
  async (req: Request<{ casketid: string }>, res, next) => {
    try {
      const casketId = parseInt(req.params.casketid, 10);
      const result = await pool.query(
        `
      SELECT
        c.deliveryid,
        c.deliverydate,
        c.quantityreceived,
        c.totalamountpaid,
        c.deliverydate,
        cc.caskettype
      FROM casketdelivery AS c
      JOIN casketinventory AS cc
        ON c.casketid = cc.casketid
      WHERE c.casketid = $1
      ORDER BY c.deliverydate DESC;
      `,
        [casketId],
      );
      res.json({
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM casketinventory ORDER BY caskettier, caskettype',
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
