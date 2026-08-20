import { Request, Response, NextFunction } from 'express';

const POSTGRES_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
} as const;

const BETTER_AUTH_ERROR_CODES = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
} as const;

export default function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(error);

  switch (error.code) {
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
      return res.status(409).json({
        error: error.detail,
      });
    case BETTER_AUTH_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      return res.status(409).json({
        error: 'User already exists. Please use another email address.',
      });
    default:
      return res.status(500).json({
        error: 'Internal server error.',
      });
  }
}
