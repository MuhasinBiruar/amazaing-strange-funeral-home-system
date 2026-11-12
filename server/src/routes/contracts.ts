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
import {
  createContractQuerySchema,
  updateContractQuerySchema,
  type CreateContractQuery,
  type UpdateContractQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';
import validateParams from '@/middleware/validate-params';
import { withTransaction } from '@/util/with-transaction';
import { triggerNotificationSweep } from '@/lib/notifications';
import { refreshServiceStatuses } from '@/lib/service-status';

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
 * that casket's stock by one - assigning a package to a case consumes one
 * physical casket.
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
            'SELECT casketid, price FROM package WHERE packageid = $1',
            [parsed.packageid],
          );
          if (packageResult.rows.length === 0) {
            throw new NotFoundError('Referenced package does not exist.');
          }
          const casketid: number | null = packageResult.rows[0].casketid;
          const packagePrice = Number(packageResult.rows[0].price);

          const lifeplanResult = await client.query<{
            totalamount: string;
            use_benefits: boolean;
          }>(
            'SELECT totalamount::text, use_benefits FROM lifeplan WHERE caseid = $1',
            [parsed.caseid],
          );
          if (lifeplanResult.rows.length > 0 && parsed.useLifeplanAmount) {
            const lifeplan = lifeplanResult.rows[0];
            const expectedAmount = Math.max(
              0,
              packagePrice - Number(lifeplan.totalamount),
            );
            if (
              (lifeplan.use_benefits &&
                packagePrice !== Number(lifeplan.totalamount)) ||
              (!lifeplan.use_benefits &&
                packagePrice <= Number(lifeplan.totalamount))
            ) {
              throw new BadRequestError(
                lifeplan.use_benefits
                  ? 'This life-plan package must match the plan amount.'
                  : 'This upgraded package must cost more than the life-plan amount.',
              );
            }
            if (Number(parsed.totalamount) !== expectedAmount) {
              throw new BadRequestError(
                'The contract additional amount does not match the package and life-plan amounts.',
              );
            }
          }

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

          await client.query(
            `UPDATE public.deceasedrecord
             SET servicestatus = 'active'
             WHERE caseid = $1`,
            [parsed.caseid],
          );

          return { contract: contractResult.rows[0], casketWarning };
        },
      );

      triggerNotificationSweep();

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

/**
 * Changes a contract's burial deadline. The service status depends on it
 * (e.g. a paid Direct case completes once its deadline passes), so it's
 * recalculated straight away.
 */
router.patch(
  '/:id',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateContractQuerySchema),
  async (
    req: Request<IdParam, {}, UpdateContractQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { burialdatedeadline } = req.body;

      const contract = await withTransaction(async (client) => {
        const current = await client.query<{
          caseid: number;
          signeddate: string;
        }>(
          `SELECT caseid, signeddate::text AS signeddate
           FROM contract WHERE contractid = $1
           FOR UPDATE`,
          [req.params.id],
        );
        if (current.rows.length === 0)
          throw new NotFoundError('Contract not found.');

        const { caseid, signeddate } = current.rows[0];
        // Both are `yyyy-mm-dd`, so they compare as strings.
        if (burialdatedeadline < signeddate)
          throw new BadRequestError(
            `The burial deadline can't be before the contract was signed (${signeddate}).`,
          );

        const updated = await client.query(
          `UPDATE contract SET burialdatedeadline = $1::date
           WHERE contractid = $2
           RETURNING *`,
          [burialdatedeadline, req.params.id],
        );

        await refreshServiceStatuses(client, caseid);

        return updated.rows[0];
      });

      triggerNotificationSweep();

      const deceasedName = await getDeceasedName(contract.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} changed the burial deadline for ${deceasedName} to ${burialdatedeadline}`;

      res.json({ data: contract });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
