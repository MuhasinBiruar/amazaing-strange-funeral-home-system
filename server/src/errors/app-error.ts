import { AppErrorResponse } from 'shared';

type IAppErrorResponse = AppErrorResponse['error'];

export class AppError extends Error implements IAppErrorResponse {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
