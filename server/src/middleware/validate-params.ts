import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export default function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(result.error);

    req.params = result.data as typeof req.params;
    next();
  };
}
