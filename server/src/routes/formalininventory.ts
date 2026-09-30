import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { BadRequestError, NotFoundError } from '@/errors';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { withTransaction } from '@/util/with-transaction';
import {
  createFormalinUsageSchema,
  formalinInventoryMutationSchema,
  type CreateFormalinUsage,
  type FormalinInventoryMutation,
} from 'shared';
import { paginationQuerySchema } from 'shared/utils';

const router = Router();

async function getLatestInventory(client = pool) {
  const result = await client.query(
    `
      SELECT formalinid, currentstock, minimumthreshold, date
      FROM formalininventory
      ORDER BY date DESC, formalinid DESC
      LIMIT 1
    `,
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Formalin inventory has not been initialized.');
  }

  return result.rows[0];
}

function getWarning(currentstock: number, minimumthreshold: number) {
  if (currentstock <= minimumthreshold) {
    return `Formalin stock has reached the minimum threshold (${currentstock} liters remaining).`;
  }

  return null;
}

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    res.json({ data: await getLatestInventory() });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(formalinInventoryMutationSchema),
  async (
    req: Request<{}, {}, FormalinInventoryMutation>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const { inventory, warning } = await withTransaction(async (client) => {
        let currentStock = 0;

        const latestResult = await client.query(
          `
            SELECT currentstock
            FROM formalininventory
            ORDER BY date DESC, formalinid DESC
            LIMIT 1
            FOR UPDATE
          `,
        );

        if (latestResult.rows.length > 0) {
          currentStock = Number(latestResult.rows[0].currentstock);
        }

        const inventoryResult = await client.query(
          `
            INSERT INTO formalininventory (currentstock, minimumthreshold)
            VALUES ($1, $2)
            RETURNING formalinid, currentstock, minimumthreshold, date
          `,
          [currentStock + parsed.currentstock, parsed.minimumthreshold],
        );
        const inventory = inventoryResult.rows[0];

        await client.query(
          `
            INSERT INTO formalindelivery (
              quantityreceived,
              deliverydate,
              formalinid,
              totalamountpaid
            ) VALUES ($1, NOW(), $2, 0)
          `,
          [parsed.currentstock, inventory.formalinid],
        );

        return {
          inventory,
          warning: getWarning(
            Number(inventory.currentstock),
            Number(inventory.minimumthreshold),
          ),
        };
      });

      res.locals.auditAction = `${res.locals.session.user.name} added ${parsed.currentstock} liters of formalin`;
      res.status(201).json({ data: inventory, warning });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/deliveries', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT deliveryid, quantityreceived, deliverydate, formalinid, totalamountpaid
        FROM formalindelivery
        ORDER BY deliverydate DESC, deliveryid DESC
      `,
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/usage', requireAuth, async (req, res, next) => {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);
    const [dataResult, countResult] = await withRepeatableRead(async (client) =>
      Promise.all([
        client.query(
          `
            SELECT usageid, quantityused, usagedate, casetype, caseid, formalinid
            FROM formalinusage
            ORDER BY usagedate DESC, usageid DESC
            LIMIT $1 OFFSET $2
          `,
          [limit, (page - 1) * limit],
        ),
        client.query('SELECT COUNT(*)::int AS total FROM formalinusage'),
      ]),
    );

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

router.post(
  '/usage',
  requireAuth,
  validate(createFormalinUsageSchema),
  async (
    req: Request<{}, {}, CreateFormalinUsage>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await withTransaction(async (client) => {
        const inventoryResult = await client.query(
          `
            SELECT formalinid, currentstock, minimumthreshold
            FROM formalininventory
            WHERE formalinid = $1
            FOR UPDATE
          `,
          [parsed.formalinid],
        );

        if (inventoryResult.rows.length === 0) {
          throw new NotFoundError(
            'Referenced formalin inventory item does not exist.',
          );
        }

        const inventory = inventoryResult.rows[0];
        const currentStock = Number(inventory.currentstock);
        if (parsed.quantityused > currentStock) {
          throw new BadRequestError('Please update the stock first.');
        }

        const caseResult = await client.query(
          `SELECT plantype FROM deceasedrecord WHERE caseid = $1`,
          [parsed.caseid],
        );
        if (caseResult.rows.length === 0) {
          throw new NotFoundError('Referenced case does not exist.');
        }

        const usageResult = await client.query(
          `
            INSERT INTO formalinusage (
              quantityused,
              casetype,
              caseid,
              formalinid
            ) VALUES ($1, $2, $3, $4)
            RETURNING usageid, quantityused, usagedate, casetype, caseid, formalinid
          `,
          [
            parsed.quantityused,
            caseResult.rows[0].plantype,
            parsed.caseid,
            parsed.formalinid,
          ],
        );

        const updatedStock = currentStock - parsed.quantityused;
        const inventoryInsert = await client.query(
          `
            INSERT INTO formalininventory (currentstock, minimumthreshold)
            VALUES ($1, $2)
            RETURNING currentstock, minimumthreshold
          `,
          [updatedStock, parsed.minimumthreshold],
        );

        return {
          usage: usageResult.rows[0],
          inventory: inventoryInsert.rows[0],
          warning: getWarning(updatedStock, parsed.minimumthreshold),
        };
      });

      res.locals.auditAction = `${res.locals.session.user.name} recorded ${parsed.quantityused} liters of formalin usage for case ${parsed.caseid}`;
      res.status(201).json({
        data: result.usage,
        inventory: result.inventory,
        warning: result.warning,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
