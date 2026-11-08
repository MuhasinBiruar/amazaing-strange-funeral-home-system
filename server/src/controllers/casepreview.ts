import { NotFoundError } from '@/errors';
import type { LifeplanAgentLocals } from '@/types/controllers';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import type { NextFunction, Request, Response } from 'express';
import type { CasePreview } from 'shared';
import type { IdParam } from 'shared/utils';
import { selectCasePlan } from './caseplan';

/**
 * One case's deceased record, representative, contract and plan.
 *
 * @param companyid - When set, only a case whose life plan belongs to this
 * company is found, so an agent can't read other companies' cases.
 */
async function selectCasePreview(
  caseid: number,
  companyid: number | null,
): Promise<CasePreview | null> {
  return withRepeatableRead(async (client) => {
    const result = await client.query<Omit<CasePreview, 'plan'>>(
      `SELECT
         to_jsonb(dr) - 'managedby' AS deceased,
         CASE WHEN r.representativeid IS NULL THEN NULL
           ELSE to_jsonb(r) END AS representative,
         CASE WHEN c.contractid IS NULL THEN NULL
           ELSE to_jsonb(c) END AS contract
       FROM deceasedrecord dr
       LEFT JOIN representative r ON r.representativeid = dr.representedby
       LEFT JOIN contract c ON c.caseid = dr.caseid
       WHERE dr.caseid = $1
         AND (
           $2::int IS NULL OR EXISTS (
             SELECT 1 FROM lifeplan lp
             WHERE lp.caseid = dr.caseid AND lp.companyid = $2::int
           )
         )`,
      [caseid, companyid],
    );
    if (result.rows.length === 0) return null;

    const plan = await selectCasePlan(client, caseid);
    if (!plan) return null;

    return { ...result.rows[0], plan };
  });
}

/**
 * Sample URL: `http://localhost:4000/deceasedrecords/12/preview`
 */
export const getCasePreview = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const preview = await selectCasePreview(Number(req.params.id), null);
    if (!preview) throw new NotFoundError('Case not found.');

    res.json({ data: preview });
  } catch (error) {
    next(error);
  }
};

/**
 * The same as {@link getCasePreview}, limited to the agent's own company.
 *
 * Sample URL: `http://localhost:4000/lifeplans/mine/12`
 */
export const getMyCasePreview = async (
  req: Request<IdParam>,
  res: Response<{}, LifeplanAgentLocals>,
  next: NextFunction,
) => {
  try {
    const companyid = res.locals.agentCompanyId;
    if (companyid === undefined) throw new NotFoundError('Case not found.');

    const preview = await selectCasePreview(Number(req.params.id), companyid);
    if (!preview) throw new NotFoundError('Case not found.');

    res.json({ data: preview });
  } catch (error) {
    next(error);
  }
};
