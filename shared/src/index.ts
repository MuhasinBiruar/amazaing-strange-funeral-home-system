import contactNumberSchema from './schemas/util/contact-number-schema';
import nameSchema from './schemas/util/name-schema';
import passwordSchema from './schemas/util/password-schema';

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

const ZodUtils = {
  nameSchema,
  contactNumberSchema,
  passwordSchema,
};

export { ZodUtils };
export * from './schemas/burialrecord';
export * from './schemas/case';
export * from './schemas/contract';
export * from './schemas/deceasedrecord';
export * from './schemas/direct';
export * from './schemas/document';
export * from './schemas/financial';
export * from './schemas/lgucase';
export * from './schemas/lifeplan';
export * from './schemas/lifeplancompany';
export * from './schemas/package';
export * from './schemas/representative';
export * from './schemas/staff';
