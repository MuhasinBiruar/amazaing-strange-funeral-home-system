import { Response } from 'express';
import { DatabaseError } from 'pg';
import {
  FK_CONSTRAINTS,
  POSTGRES_ERROR_CODES,
  UNIQUE_CONSTRAINTS,
} from './constants';

export function handleDatabaseError(error: DatabaseError, res: Response) {
  switch (error.code) {
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
      const match = FK_CONSTRAINTS[error.constraint!];

      return res.status(400).json({
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message:
            'A related resource referenced in this request does not exist.',
          ...(match && {
            details: [
              {
                field: match.field,
                message: match.message,
              },
            ],
          }),
        },
      });
    }

    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION: {
      const match = UNIQUE_CONSTRAINTS[error.constraint!];

      return res.status(409).json({
        error: {
          code: 'UNIQUE_VIOLATION',
          message: 'A record with this value already exists.',
          ...(match && {
            details: [
              {
                field: match.field,
                message: match.message,
              },
            ],
          }),
        },
      });
    }

    default:
      return null;
  }
}
