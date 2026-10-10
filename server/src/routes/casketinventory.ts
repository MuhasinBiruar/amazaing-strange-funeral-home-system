import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import {
  createCasketInventoryQuerySchema,
  getPaginatedCasketInventoryQuerySchema,
  updateCasketInventoryQuerySchema,
  type CreateCasketInventoryQuery,
  type UpdateCasketInventoryQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import { withTransaction } from '@/util/with-transaction';

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
          SELECT casketid, caskettype, caskettier, currentstock, minimumthreshold
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

/**
 * Throws if another casket already uses `caskettype` (case-insensitive), so
 * the casket picker never shows two identically named caskets.
 *
 * @param excludeCasketId The casket being edited, which may keep its own name.
 */
async function assertCasketNameAvailable(
  caskettype: string,
  excludeCasketId?: number,
) {
  const result = await pool.query(
    `SELECT 1 FROM casketinventory
     WHERE lower(caskettype) = lower($1) AND casketid <> COALESCE($2, -1)`,
    [caskettype, excludeCasketId ?? null],
  );
  if (result.rows.length > 0) {
    throw new ConflictError(`A casket named "${caskettype}" already exists.`);
  }
}

/**
 * Adds a casket to inventory. It starts with no stock; stock is added by
 * recording a delivery.
 */
router.post(
  '/',
  requireAuth,
  validate(createCasketInventoryQuerySchema),
  async (
    req: Request<{}, {}, CreateCasketInventoryQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      await assertCasketNameAvailable(parsed.caskettype);

      const result = await pool.query(
        `INSERT INTO casketinventory (caskettype, caskettier, currentstock, minimumthreshold)
         VALUES ($1, $2, 0, $3)
         RETURNING *`,
        [parsed.caskettype, parsed.caskettier, parsed.minimumthreshold],
      );

      res.locals.auditAction = `${res.locals.session.user.name} added ${parsed.caskettype} (${parsed.caskettier}) to casket inventory`;
      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Edits a casket's name, tier, or minimum threshold. Stock can't be edited
 * here; it only changes through deliveries and contracts.
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateCasketInventoryQuerySchema),
  async (
    req: Request<IdParam, {}, UpdateCasketInventoryQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const parsed = req.body;

      if (Object.keys(parsed).length === 0) {
        throw new BadRequestError('No fields provided for update.');
      }
      if (parsed.caskettype !== undefined) {
        await assertCasketNameAvailable(parsed.caskettype, Number(id));
      }

      const result = await pool.query(
        `UPDATE casketinventory SET
           caskettype = COALESCE($1, caskettype),
           caskettier = COALESCE($2, caskettier),
           minimumthreshold = COALESCE($3, minimumthreshold)
         WHERE casketid = $4
         RETURNING *`,
        [
          parsed.caskettype ?? null,
          parsed.caskettier ?? null,
          parsed.minimumthreshold ?? null,
          id,
        ],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError('Casket not found.');
      }

      res.locals.auditAction = `${res.locals.session.user.name} edited casket ${result.rows[0].caskettype}`;
      res.json({ data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Deletes a casket that nothing references yet (e.g. one added by mistake).
 *
 * @remarks
 * Refused with 409 when the casket is linked to a package (naming them, so
 * staff know what to change first), or has recorded deliveries or inventory
 * audits, since deleting it would orphan that cost and audit history.
 *
 * The casket row is locked `FOR UPDATE` first. A package insert referencing
 * it takes a `FOR KEY SHARE` lock on the same row for its foreign key check,
 * which conflicts, so a package can't be linked between the check and the
 * delete.
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  async (req: Request<IdParam>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const caskettype = await withTransaction(async (client) => {
        const casketResult = await client.query(
          'SELECT caskettype FROM casketinventory WHERE casketid = $1 FOR UPDATE',
          [id],
        );
        if (casketResult.rows.length === 0) {
          throw new NotFoundError('Casket not found.');
        }
        const { caskettype } = casketResult.rows[0];

        const packageResult = await client.query<{ packagename: string }>(
          'SELECT packagename FROM package WHERE casketid = $1 ORDER BY packagename',
          [id],
        );
        if (packageResult.rows.length > 0) {
          const names = packageResult.rows.map((p) => p.packagename);
          throw new ConflictError(
            `${caskettype} can't be deleted because ${names.length === 1 ? 'a package uses' : `${names.length} packages use`} it: ${names.join(', ')}. Change or remove ${names.length === 1 ? 'that package' : 'those packages'} first.`,
          );
        }

        const historyResult = await client.query<{
          deliveries: number;
          audits: number;
        }>(
          `SELECT
             (SELECT COUNT(*)::int FROM casketdelivery WHERE casketid = $1) AS deliveries,
             (SELECT COUNT(*)::int FROM inventoryaudit WHERE casketid = $1) AS audits`,
          [id],
        );
        const { deliveries, audits } = historyResult.rows[0];
        if (deliveries > 0 || audits > 0) {
          const history = [
            deliveries > 0 &&
              `${deliveries} recorded deliver${deliveries === 1 ? 'y' : 'ies'}`,
            audits > 0 && `${audits} inventory audit${audits === 1 ? '' : 's'}`,
          ].filter(Boolean);
          throw new ConflictError(
            `${caskettype} can't be deleted because it has ${history.join(' and ')}. Deleting it would leave that history without a casket.`,
          );
        }

        await client.query('DELETE FROM casketinventory WHERE casketid = $1', [
          id,
        ]);
        return caskettype as string;
      });

      res.locals.auditAction = `${res.locals.session.user.name} deleted casket ${caskettype}`;
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
