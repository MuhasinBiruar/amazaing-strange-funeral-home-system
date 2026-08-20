import type { NextFunction, Request, Response } from 'express';

export default function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.locals.session.user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  next();
}
