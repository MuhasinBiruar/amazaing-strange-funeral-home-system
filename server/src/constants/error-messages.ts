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
  package_casketid_fkey: {
    field: 'casketid',
    message: 'Referenced casket does not exist.',
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
  lgucase_caseid_fkey: {
    field: 'caseid',
    message: 'Referenced deceased record does not exist.',
  },
  casketdelivery_casketid_fkey: {
    field: 'casketid',
    message: 'Referenced casket does not exist.',
  },
  formalindelivery_formalinid_fkey: {
    field: 'formalinid',
    message: 'Referenced formalin inventory item does not exist.',
  },
  expense_recordedby_fkey: {
    field: 'recordedby',
    message: 'Staff member who recorded the expense does not exist.',
  },
  transaction_caseid_fkey: {
    field: 'caseid',
    message: 'Referenced deceased record does not exist.',
  },
  lifeplan_agent_companyid_fkey: {
    field: 'companyid',
    message: 'Referenced life plan company does not exist.',
  },
};

export const UNIQUE_CONSTRAINTS: Record<
  string,
  { field: string; message: string }
> = {
  burialrecord_caseid_key: {
    field: 'caseid',
    message: 'A burial record for this case already exists.',
  },
  contract_caseid_key: {
    field: 'caseid',
    message: 'A contract for this case already exists.',
  },
  lifeplan_caseid_key: {
    field: 'caseid',
    message: 'A lifeplan for this case already exists.',
  },
  lgucase_caseid_key: {
    field: 'caseid',
    message: 'An LGU case for this case already exists.',
  },
  staff_username_key: {
    field: 'username',
    message: 'That username is already taken.',
  },
  staff_email_key: {
    field: 'username',
    message: 'That username is already taken.',
  },
};
