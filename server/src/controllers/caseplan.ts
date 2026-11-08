import type { PoolClient } from 'pg';
import pool from '@/db';
import { ConflictError, ForbiddenError, NotFoundError } from '@/errors';
import { triggerNotificationSweep } from '@/lib/notifications';
import { refreshServiceStatuses } from '@/lib/service-status';
import type { Locals } from '@/types/controllers';
import { joinName } from '@/util/audit-log';
import { withTransaction } from '@/util/with-transaction';
import type { NextFunction, Request, Response } from 'express';
import type { CasePlan, UpdateCasePlanQuery } from 'shared';
import type { IdParam } from 'shared/utils';

const PLAN_LABELS: Record<CasePlan['plantype'], string> = {
  Direct: 'Direct',
  Life: 'Life Plan',
  LGU: 'LGU',
};

async function selectCasePlan(
  client: PoolClient | typeof pool,
  caseid: number,
): Promise<CasePlan | null> {
  const result = await client.query<CasePlan>(
    `SELECT
       dr.plantype,
       CASE WHEN lp.planid IS NULL THEN NULL ELSE jsonb_build_object(
         'planid', lp.planid,
         'plannumber', lp.plannumber,
         'planholdername', lp.planholdername,
         'totalamount', lp.totalamount,
         'use_benefits', COALESCE(lp.use_benefits, true),
         'caseid', lp.caseid,
         'companyid', lp.companyid,
         'companyname', lc.companyname
       ) END AS lifeplan,
       CASE WHEN lg.lgucaseid IS NULL THEN NULL ELSE jsonb_build_object(
         'lgucaseid', lg.lgucaseid,
         'reimbursementstatus', lg.reimbursementstatus,
         'reimbursementamount', lg.reimbursementamount,
         'caseid', lg.caseid,
         'lguid', lg.lguid,
         'lguname', l.lguname
       ) END AS lgucase
     FROM deceasedrecord dr
     LEFT JOIN lifeplan lp ON lp.caseid = dr.caseid
     LEFT JOIN lifeplancompany lc ON lc.companyid = lp.companyid
     LEFT JOIN lgucase lg ON lg.caseid = dr.caseid
     LEFT JOIN lgu l ON l.lguid = lg.lguid
     WHERE dr.caseid = $1`,
    [caseid],
  );
  return result.rows[0] ?? null;
}

/**
 * A case's plan type and the life plan or LGU details that go with it.
 *
 * Sample URL: `http://localhost:4000/deceasedrecords/12/plan`
 */
export const getCasePlan = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const plan = await selectCasePlan(pool, Number(req.params.id));
    if (!plan) throw new NotFoundError('Deceased record not found.');

    res.json({ data: plan });
  } catch (error) {
    next(error);
  }
};

/**
 * Sets a case's plan type with the details intake asks for: a life plan for
 * Life, an LGU case for LGU. Switching away from Life or LGU removes the old
 * life plan / LGU record, so a case only ever has the one its plan type uses.
 *
 * @remarks
 * Contracts made earlier keep the total they were made with.
 */
export const updateCasePlan = async (
  req: Request<IdParam, {}, UpdateCasePlanQuery, {}, Locals>,
  res: Response<{}, Locals>,
  next: NextFunction,
) => {
  try {
    const caseid = Number(req.params.id);
    const parsed = req.body;
    const { id: userId, role, name: userName } = res.locals.session.user;

    const { plan, deceasedName } = await withTransaction(async (client) => {
      const caseResult = await client.query<{
        managedby: string;
        firstname: string;
        middlename: string | null;
        lastname: string;
      }>(
        `SELECT managedby, firstname, middlename, lastname
         FROM deceasedrecord WHERE caseid = $1
         FOR UPDATE`,
        [caseid],
      );
      const record = caseResult.rows[0];
      if (!record) throw new NotFoundError('Deceased record not found.');

      // Same rule as editing the rest of the record.
      if (
        role !== 'admin' &&
        role !== 'superadmin' &&
        record.managedby !== userId
      )
        throw new ForbiddenError(
          'You do not have permission to modify this record.',
        );

      await client.query(
        `UPDATE deceasedrecord
         SET plantype = $1, hasmaturedlifeplan = $2
         WHERE caseid = $3`,
        // Every life plan the home takes is matured.
        [parsed.plantype, parsed.plantype === 'Life', caseid],
      );

      if (parsed.plantype === 'Life') {
        const lp = parsed.lifeplan;
        await client.query(
          `INSERT INTO lifeplan
             (plannumber, planholdername, totalamount, use_benefits, caseid, companyid)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (caseid) DO UPDATE SET
             plannumber = EXCLUDED.plannumber,
             planholdername = EXCLUDED.planholdername,
             totalamount = EXCLUDED.totalamount,
             use_benefits = EXCLUDED.use_benefits,
             companyid = EXCLUDED.companyid`,
          [
            lp.plannumber,
            lp.planholdername,
            lp.totalamount,
            lp.use_benefits,
            caseid,
            lp.companyid,
          ],
        );
      } else {
        await client.query('DELETE FROM lifeplan WHERE caseid = $1', [caseid]);
      }

      if (parsed.plantype === 'LGU') {
        const lg = parsed.lgucase;
        await client.query(
          `INSERT INTO lgucase
             (reimbursementstatus, reimbursementamount, caseid, lguid)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (caseid) DO UPDATE SET
             reimbursementstatus = EXCLUDED.reimbursementstatus,
             reimbursementamount = EXCLUDED.reimbursementamount,
             lguid = EXCLUDED.lguid`,
          [lg.reimbursementstatus, lg.reimbursementamount, caseid, lg.lguid],
        );
      } else {
        await client.query('DELETE FROM lgucase WHERE caseid = $1', [caseid]);
      }

      // Service status is worked out differently for each plan type.
      await refreshServiceStatuses(client, caseid);

      return {
        plan: (await selectCasePlan(client, caseid))!,
        deceasedName: joinName(
          record.firstname,
          record.middlename,
          record.lastname,
        ),
      };
    }).catch((error: { code?: string; constraint?: string }) => {
      if (
        error.code === '23505' &&
        error.constraint === 'lifeplan_company_plannumber_key'
      )
        throw new ConflictError(
          'Another case already uses this plan number with this company.',
        );
      if (error.code === '23503')
        throw new NotFoundError(
          'The selected company or LGU no longer exists.',
        );
      throw error;
    });

    triggerNotificationSweep();

    res.locals.auditAction = `${userName} set the plan of ${deceasedName} (case #${caseid}) to ${PLAN_LABELS[parsed.plantype]}`;

    res.json({ data: plan });
  } catch (error) {
    next(error);
  }
};
