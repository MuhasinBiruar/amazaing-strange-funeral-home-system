import type { NextFunction, Request, Response } from 'express';

export default function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.session?.user;

  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (user.role !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  next();
}
