import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import { NotFoundError, BadRequestError } from '@/errors';
import validate from '@/middleware/validate';
import { getDeceasedName } from '@/util/audit-log';
import { createContractQuerySchema, type CreateContractQuery } from 'shared';
import { withTransaction } from '@/util/with-transaction';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from contract');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

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

/**
 * Creates a contract and, if its package has a casket linked, decrements
 * that casket's stock by one — assigning a package to a case consumes one
 * physical casket.
 *
 * @remarks
 * Runs as a single transaction: the casket row is locked with `FOR UPDATE`
 * before checking/decrementing stock, so two contracts created for the same
 * casket at once can't both succeed past a stock count of 1. Plain
 * `BEGIN`/`COMMIT` (READ COMMITTED) rather than {@link withRepeatableRead} —
 * `FOR UPDATE` under REPEATABLE READ can raise serialization errors under
 * concurrent writes to the same row, needing a retry loop this app's actual
 * concurrency doesn't warrant. `FOR UPDATE` alone is the standard, sufficient
 * pattern for "decrement stock safely."
 *
 * A package created before this feature existed may have no casket linked
 * (`casketid IS NULL`) — in that case stock handling is skipped entirely.
 */
router.post(
  '/',
  requireAuth,
  validate(createContractQuerySchema),
  async (
    req: Request<{}, {}, CreateContractQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;

      const { contract, casketWarning } = await withTransaction(
        async (client) => {
          const packageResult = await client.query(
            'SELECT casketid FROM package WHERE packageid = $1',
            [parsed.packageid],
          );
          if (packageResult.rows.length === 0) {
            throw new NotFoundError('Referenced package does not exist.');
          }
          const casketid: number | null = packageResult.rows[0].casketid;

          let casketWarning: string | null = null;

          if (casketid !== null) {
            const casketResult = await client.query(
              `SELECT caskettype, currentstock, minimumthreshold
             FROM casketinventory WHERE casketid = $1 FOR UPDATE`,
              [casketid],
            );
            if (casketResult.rows.length === 0) {
              throw new NotFoundError('Referenced casket does not exist.');
            }

            const casket = casketResult.rows[0];
            if (casket.currentstock <= 0) {
              throw new BadRequestError(
                `No stock remaining for ${casket.caskettype}.`,
              );
            }

            const decremented = await client.query(
              `UPDATE casketinventory SET currentstock = currentstock - 1
             WHERE casketid = $1 RETURNING currentstock`,
              [casketid],
            );
            const newStock: number = decremented.rows[0].currentstock;

            if (newStock <= casket.minimumthreshold) {
              casketWarning = `Stock for ${casket.caskettype} has reached the minimum threshold (${newStock} remaining).`;
            }
          }

          const contractResult = await client.query(
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

          return { contract: contractResult.rows[0], casketWarning };
        },
      );

      const deceasedName = await getDeceasedName(parsed.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} created a new contract for ${deceasedName}`;

      res.status(201).json({
        data: contract,
        casketWarning,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
