import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = 'Bad request.',
    details?: Array<{ field: string; message: string }>,
  ) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists.') {
    super(409, 'CONFLICT', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access.') {
    super(403, 'FORBIDDEN', message);
  }
}
