import { z } from 'zod';
import { ZodUtils } from 'shared';
const { nameSchema, contactNumberSchema } = ZodUtils;

export interface IntakeValidationErrors {
  [field: string]: string;
}

const requiredText = (message: string) => z.string().trim().min(1, message);

export const intakeFormSchema = z
  .object({
    // Vital Statistics
    firstname: nameSchema('First name'),
    middlename: nameSchema('Middle name', false),
    lastname: nameSchema('Last name'),
    dateofdeath: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.coerce.date().optional(),
    ),

    // Service Arrangement
    planType: requiredText('Please select a plan type.'),
    lifeplancompany: z.string().trim().optional(),

    // Representative Information
    rep_firstname: nameSchema('First name'),
    rep_middlename: nameSchema('Middle name'),
    rep_lastname: nameSchema('Last name'),
    rep_contactnumber: requiredText('Contact number is required.').pipe(
      contactNumberSchema,
    ),
    rep_address: requiredText('Address is required.'),
  })
  .refine(
    (data) =>
      data.planType === 'Life Plan' &&
      (!data.lifeplancompany || data.lifeplancompany.length === 0),
    {
      error: 'Life plan company is required.',
      path: ['lifeplancompany'],
    },
  );

export type IntakeForm = z.infer<typeof intakeFormSchema>;

function normalizeIntakeInput(data: Record<string, string | undefined>) {
  return {
    firstname: data.firstname ?? '',
    middlename: data.middlename ?? '',
    lastname: data.lastname ?? '',
    dateofdeath: data.dateofdeath ?? '',
    typeofdeath: data.typeofdeath ?? '',
    causeofdeath: data.causeofdeath ?? '',
    planType: data.planType ?? '',
    lifeplancompany: data.lifeplancompany ?? '',
    rep_firstname: data.rep_firstname ?? '',
    rep_middlename: data.rep_middlename ?? '',
    rep_lastname: data.rep_lastname ?? '',
    rep_contactnumber: data.rep_contactnumber ?? '',
    rep_address: data.rep_address ?? '',
  };
}

export function validateIntakeForm(
  data: Record<string, string | undefined>,
): IntakeValidationErrors {
  const result = intakeFormSchema.safeParse(normalizeIntakeInput(data));
  if (result.success) return {};

  const errors: IntakeValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);

    // Keep only the first failing rule per field
    if (!(field in errors)) errors[field] = issue.message;
  }
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
  'rep_middlename',
  'rep_lastname',
  'rep_contactnumber',
  'rep_address',
];

export function getFirstErrorField(errors: IntakeValidationErrors) {
  for (const field of INTAKE_FIELD_ORDER) if (errors[field]) return field;

  return null;
}
