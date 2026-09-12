export interface IntakeValidationErrors {
  [field: string]: string;
}

const PHONE_REGEX = /^(\+63|0)9\d{9}$/;

export function validateIntakeForm(
  data: Record<string, string | undefined>,
): IntakeValidationErrors {
  const errors: IntakeValidationErrors = {};

  // Vital Statistics
  if (!data.firstname?.trim()) errors.firstname = 'First name is required.';
  if (!data.lastname?.trim()) errors.lastname = 'Last name is required.';
  if (!data.dateofdeath) errors.dateofdeath = 'Date of death is required.';
  if (!data.typeofdeath) errors.typeofdeath = 'Type of death is required.';
  if (!data.causeofdeath?.trim())
    errors.causeofdeath = 'Cause of death is required.';

  // Service Arrangement
  if (!data.planType) errors.planType = 'Please select a plan type.';
  if (data.planType === 'Life Plan' && !data.lifeplancompany?.trim()) {
    errors.lifeplancompany = 'Life plan company is required.';
  }

  // Representative Information
  if (!data.rep_firstname?.trim())
    errors.rep_firstname = 'First name is required.';
  if (!data.rep_lastname?.trim())
    errors.rep_lastname = 'Last name is required.';
  if (!data.rep_relationship?.trim())
    errors.rep_relationship = 'Relationship is required.';
  if (!data.rep_contactnumber?.trim()) {
    errors.rep_contactnumber = 'Contact number is required.';
  } else if (!PHONE_REGEX.test(data.rep_contactnumber.replace(/\s/g, ''))) {
    errors.rep_contactnumber = 'Enter a valid PH number (e.g. 0912 345 6789).';
  }
  if (!data.rep_address?.trim()) errors.rep_address = 'Address is required.';

  return errors;
}

// Order determines which field gets focused first when multiple are invalid
export const INTAKE_FIELD_ORDER = [
  'firstname',
  'lastname',
  'dateofdeath',
  'typeofdeath',
  'causeofdeath',
  'planType',
  'lifeplancompany',
  'rep_firstname',
  'rep_lastname',
  'rep_relationship',
  'rep_contactnumber',
  'rep_address',
];

export function getFirstErrorField(
  errors: IntakeValidationErrors,
): string | null {
  for (const field of INTAKE_FIELD_ORDER) {
    if (errors[field]) return field;
  }
  return null;
}
