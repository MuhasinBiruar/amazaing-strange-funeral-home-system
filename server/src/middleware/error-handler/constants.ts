export const POSTGRES_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
} as const;

export const FK_CONSTRAINTS: Record<string, { field: string; message: string }> = {
  deceasedrecord_managedby_fkey: {
    field: 'managedby',
    message: 'Please select a valid staff member to manage this record.',
  },
  deceasedrecord_representedby_fkey: {
    field: 'representedby',
    message: 'The selected representative could not be found.',
  },
  document_verifiedby_fkey: {
    field: 'verifiedby',
    message: 'Please choose a valid staff member to verify this document.',
  },
  burialrecord_caseid_fkey: {
    field: 'caseid',
    message: 'The linked deceased record could not be found.',
  },
};

export const UNIQUE_CONSTRAINTS: Record<string, { field: string; message: string }> =
  {};

