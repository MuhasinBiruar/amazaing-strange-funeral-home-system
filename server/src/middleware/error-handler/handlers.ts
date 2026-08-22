import { Response } from 'express';
import { APIError } from 'better-auth';
import { DatabaseError } from 'pg';
import z, { formatError, ZodError } from 'zod';
import {
  FK_CONSTRAINTS,
  POSTGRES_ERROR_CODES,
  UNIQUE_CONSTRAINTS,
} from './constants';

export function handleZodError(error: ZodError, res: Response) {
  return res.status(400).json(z.flattenError(error));
}

export function handleAPIError(error: APIError, res: Response) {
  let statusCode = Number(error.statusCode ?? error.status);
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599)
    statusCode = 500;

  return res.status(statusCode).json({
    formErrors: [
      error.body?.message ??
        error.message ??
        'An error occurred while processing your request.',
    ],
    fieldErrors: {},
  });
}

export function handleDatabaseError(error: DatabaseError, res: Response) {
  switch (error.code) {
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
      const match = FK_CONSTRAINTS[error.constraint!];

      return res.status(400).json(
        match
          ? {
              formErrors: [],
              fieldErrors: { [match.field]: [match.message] },
            }
          : {
              formErrors: [
                'A related resource referenced in this request does not exist.',
              ],
              fieldErrors: {},
            },
      );
    }
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION: {
      const match = UNIQUE_CONSTRAINTS[error.constraint!];

      return res.status(409).json(
        match?.field
          ? {
              formErrors: [],
              fieldErrors: { [match.field]: [match.message] },
            }
          : {
              formErrors: ['A record with this value already exists.'],
              fieldErrors: {},
            },
      );
    }
    default: {
      return res.status(500).json({
        formErrors: ['Internal server error.'],
        fieldErrors: {},
      });
    }
  }
}
