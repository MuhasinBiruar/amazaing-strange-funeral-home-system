export interface AppErrorResponse {
  error: {
    code: string;
    message: string;
    details?: {
      field: string;
      message: string;
    }[];
  };
}

export * from './schemas/burialrecord';
export * from './schemas/case';
export * from './schemas/contract';
export * from './schemas/deceasedrecord';
export * from './schemas/document';
export * from './schemas/lifeplan';
export * from './schemas/package';
export * from './schemas/representative';
export * from './schemas/staff';
