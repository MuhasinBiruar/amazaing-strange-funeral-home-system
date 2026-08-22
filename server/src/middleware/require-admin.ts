import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/errors';

export default function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.session?.user;

  if (!user) return next(new UnauthorizedError());

  if (user.role !== 'admin') return next(new ForbiddenError());

  next();
}
