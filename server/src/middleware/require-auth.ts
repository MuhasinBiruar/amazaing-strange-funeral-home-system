import type { NextFunction, Request, Response } from 'express';
import pool from '@/db';
import { auth } from '@/lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { ForbiddenError, UnauthorizedError } from '@/errors';
import type { LifeplanAgentLocals, Locals } from '@/types/controllers';

async function authenticate(req: Request, res: Response) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) throw new UnauthorizedError();

  res.locals.session = session;
  return session;
}

/** Any signed-in account, including life plan agents. */
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await authenticate(req, res);
    next();
  } catch (error) {
    next(error);
  }
}

/** Signed-in staff (user/admin/superadmin). Life plan agents are rejected. */
export default async function requireAuth(
  req: Request,
  res: Response<{}, Locals>,
  next: NextFunction,
) {
  try {
    const session = await authenticate(req, res);
    if (session.user.role === 'lifeplan_agent') throw new ForbiddenError();
    next();
  } catch (error) {
    next(error);
  }
}

/** Life plan agents only. Exposes their company as `res.locals.agentCompanyId`. */
export async function requireLifeplanAgent(
  req: Request,
  res: Response<{}, LifeplanAgentLocals>,
  next: NextFunction,
) {
  try {
    const session = await authenticate(req, res);
    if (session.user.role !== 'lifeplan_agent') throw new ForbiddenError();

    const result = await pool.query<{ companyid: number }>(
      'SELECT companyid FROM lifeplan_agent WHERE staffid = $1',
      [session.user.id],
    );
    if (result.rows.length === 0)
      throw new ForbiddenError('No company is assigned to this account.');

    res.locals.agentCompanyId = result.rows[0].companyid;
    next();
  } catch (error) {
    next(error);
  }
}
