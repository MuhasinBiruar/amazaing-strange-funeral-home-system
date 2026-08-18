import { Request, Response, NextFunction } from 'express';

const POSTGRES_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
} as const;

export default function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(error);

  if (error.code === POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION)
    return res.status(400).json({
      error: error.detail,
    });
  else if (error.code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION)
    return res.status(400).json({
      error: error.detail,
    });

  return res.status(500).json({
    error: 'Internal server error.',
  });
}
