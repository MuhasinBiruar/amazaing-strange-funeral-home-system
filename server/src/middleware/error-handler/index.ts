import { APIError } from 'better-auth';
import { Request, Response, NextFunction } from 'express';
import { DatabaseError } from 'pg';
import { ZodError } from 'zod';
import { handleDatabaseError } from './handlers.ts';
import { AppError } from '@/errors';

export default function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'One or more fields are invalid.',
        details: error.issues.map((issue) => ({
          field:
            issue.path.reduce<string>((prev, cur) => {
              if (typeof cur === 'number') return `${prev}[${cur}]`;
              const curStr = String(cur);
              return prev ? `${prev}.${curStr}` : `${curStr}`;
            }, '') || '_form',
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.status,
        message: error.message,
      },
    });
  }

  if (error instanceof DatabaseError) {
    const json = handleDatabaseError(error, res);
    if (json !== null) return json;
  }

  if (
    error instanceof SyntaxError &&
    (error as any).status === 400 &&
    'body' in error
  ) {
    return res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message:
          'Invalid JSON payload. Please check for syntax errors, trailing commas, or unquoted keys.',
      },
    });
  }

  console.error('Unhandled Error:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}
