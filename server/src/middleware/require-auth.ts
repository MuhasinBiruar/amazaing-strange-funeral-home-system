import type { NextFunction, Request, Response } from 'express';
import { auth } from '@/lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { UnauthorizedError } from '@/errors';

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) throw new UnauthorizedError();

    res.locals.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
