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

export * from './schemas/burialrecord.ts';
export * from './schemas/case.ts';
export * from './schemas/contract.ts';
export * from './schemas/deceasedrecord.ts';
export * from './schemas/document.ts';
export * from './schemas/lifeplan.ts';
export * from './schemas/package.ts';
export * from './schemas/representative.ts';
export * from './schemas/staff.ts';
