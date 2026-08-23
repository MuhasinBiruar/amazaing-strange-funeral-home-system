export const POSTGRES_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
} as const;

export const FK_CONSTRAINTS: Record<
  string,
  { field: string; message: string }
> = {
  deceasedrecord_managedby_fkey: {
    field: 'managedby',
    message: 'Staff member assigned to manage the record does not exist.',
  },
  deceasedrecord_representedby_fkey: {
    field: 'representedby',
    message: 'Representative does not exist.',
  },
  document_verifiedby_fkey: {
    field: 'verifiedby',
    message: 'Document verifier does not exist.',
  },
  burialrecord_caseid_fkey: {
    field: 'caseid',
    message: 'Referenced deceased record does not exist.',
  },
};

export const UNIQUE_CONSTRAINTS: Record<
  string,
  { field: string; message: string }
> = {};
