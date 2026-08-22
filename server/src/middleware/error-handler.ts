import { Request, Response, NextFunction } from 'express';

const POSTGRES_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
} as const;

const CONSTRAINT_MESSAGES: Record<string, string> = {
  deceasedrecord_managedby_fkey: 'The specified staff member does not exist.',
  document_verifiedby_fkey: 'The specified staff member does not exist.',
};

export default function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);

  if (error.name === 'APIError' || error.statusCode || error.status) {
    let statusCode = Number(error.statusCode ?? error.status);

    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599)
      statusCode = 500;

    const message =
      error.body?.message ??
      error.message ??
      'An error occurred while processing your request.';

    return res.status(statusCode).json({
      error: message,
    });
  }

  switch (error.code) {
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
      const message =
        CONSTRAINT_MESSAGES[error.constraint] ||
        'A related resource referenced in this request does not exist.';

      return res.status(409).json({ error: message });
    }
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION: {
      const message =
        CONSTRAINT_MESSAGES[error.constraint] ||
        'A record with this value already exists.';

      return res.status(409).json({ error: message });
    }
    default:
      return res.status(500).json({
        error: 'Internal server error.',
      });
  }
}
