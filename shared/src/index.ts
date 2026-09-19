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

export * from './schemas/cte/case';
export * from './schemas/cte/delivery';
export * from './schemas/cte/direct';
export * from './schemas/cte/financial';
export * from './schemas/db/burialrecord';
export * from './schemas/db/casketdelivery';
export * from './schemas/db/casketinventory';
export * from './schemas/db/contract';
export * from './schemas/db/deceasedrecord';
export * from './schemas/db/document';
export * from './schemas/db/formalindelivery';
export * from './schemas/db/lgucase';
export * from './schemas/db/lifeplan';
export * from './schemas/db/lifeplancompany';
export * from './schemas/db/package';
export * from './schemas/db/representative';
export * from './schemas/db/staff';
