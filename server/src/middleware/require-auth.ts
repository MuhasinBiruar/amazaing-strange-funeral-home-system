import type { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth.ts';
import { fromNodeHeaders } from 'better-auth/node';

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    res.locals.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
