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
  contract_packageid_fkey: {
    field: 'packageid',
    message: 'Referenced package does not exist.',
  },
  contract_caseid_fkey: {
    field: 'caseid',
    message: 'Referenced deceased record does not exist.',
  },
  lifeplan_caseid_fkey: {
    field: 'caseid',
    message: 'Referenced deceased record does not exist.',
  },
  lifeplan_companyid_fkey: {
    field: 'companyid',
    message: 'Referenced lifeplan company does not exist.',
  },
};

export const UNIQUE_CONSTRAINTS: Record<
  string,
  { field: string; message: string }
> = {
  contract_caseid_key: {
    field: 'caseid',
    message: 'A contract for this case already exists.',
  },
  contract_packageid_key: {
    field: 'packageid',
    message: 'A contract with this package already exists.',
  },
  lifeplan_caseid_key: {
    field: 'caseid',
    message: 'A lifeplan for this case already exists.',
  },
};
