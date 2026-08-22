import { APIError } from 'better-auth';
import { Request, Response, NextFunction } from 'express';
import { DatabaseError } from 'pg';
import { ZodError } from 'zod';
import {
  handleAPIError,
  handleDatabaseError,
  handleZodError,
} from './handlers.ts';

export default function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);

  if (error instanceof ZodError) return handleZodError(error, res);

  if (error instanceof APIError) return handleAPIError(error, res);

  if (error instanceof DatabaseError) return handleDatabaseError(error, res);

  return res.status(500).json({
    formErrors: ['Internal server error.'],
    fieldErrors: {},
  });
}
