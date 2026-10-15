import { z } from 'zod';
import { nameSchema, contactNumberSchema } from 'shared/utils';
import { lguCaseSchema } from 'shared';

export interface IntakeValidationErrors {
  [field: string]: string;
}

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = () => z.string().trim().optional();

const intakeFormSchema = z
  .object({
    // Vital Statistics
    firstname: nameSchema('First name'),
    middlename: nameSchema('Middle name', false),
    lastname: nameSchema('Last name'),
    dateofdeath: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.coerce.date().optional(),
    ),
    typeofdeath: optionalText(),
    otherTypeOfDeath: optionalText(),
    causeofdeath: optionalText(),

    // Service Arrangement
    plantype: requiredText('Please select a plan type.'),
    lifeplancompanyid: z.string().trim().optional(),
    lifeplan_plannumber: z.string().trim().optional(),
    lifeplan_planholdername: z.string().trim().optional(),
    lifeplan_totalamount: z.string().trim().optional(),
    lifeplan_use_benefits: z.string().default('true'),
    lgu_reimbursementamount: z.string().trim().optional(),
    lgu_reimbursementstatus: z.string().trim().optional(),

    // Representative Information
    rep_firstname: nameSchema('First name'),
    rep_middlename: nameSchema('Middle name'),
    rep_lastname: nameSchema('Last name'),
    rep_relationship: optionalText(),
    rep_contactnumber: requiredText('Contact number is required.').pipe(
      contactNumberSchema,
    ),
    rep_address: requiredText('Address is required.'),
  })
  .refine(
    (data) =>
      data.typeofdeath !== 'Other' ||
      (data.otherTypeOfDeath && data.otherTypeOfDeath.trim().length > 0),
    {
      error: 'Please specify the type of death.',
      path: ['otherTypeOfDeath'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'Life' &&
        (!data.lifeplancompanyid || data.lifeplancompanyid.trim().length === 0)
      ),
    {
      error: 'Please select a lifeplan company.',
      path: ['lifeplancompanyid'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'Life' &&
        (!data.lifeplan_plannumber ||
          data.lifeplan_plannumber.trim().length === 0)
      ),
    {
      error: 'Plan number is required.',
      path: ['lifeplan_plannumber'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'Life' &&
        (!data.lifeplan_planholdername ||
          data.lifeplan_planholdername.trim().length === 0)
      ),
    {
      error: 'Plan holder name is required.',
      path: ['lifeplan_planholdername'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'Life' &&
        (!data.lifeplan_totalamount ||
          data.lifeplan_totalamount.trim().length === 0)
      ),
    {
      error: 'Total amount is required.',
      path: ['lifeplan_totalamount'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'Life' &&
        data.lifeplan_totalamount &&
        data.lifeplan_totalamount.trim().length > 0 &&
        (Number.isNaN(Number(data.lifeplan_totalamount)) ||
          Number(data.lifeplan_totalamount) <= 0)
      ),
    {
      error: 'Total amount must be a valid positive number.',
      path: ['lifeplan_totalamount'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'LGU' &&
        (!data.lgu_reimbursementamount ||
          data.lgu_reimbursementamount.trim().length === 0)
      ),
    {
      error: 'Reimbursement amount is required.',
      path: ['lgu_reimbursementamount'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'LGU' &&
        data.lgu_reimbursementamount &&
        data.lgu_reimbursementamount.trim().length > 0 &&
        (Number.isNaN(Number(data.lgu_reimbursementamount)) ||
          Number(data.lgu_reimbursementamount) < 0)
      ),
    {
      error: 'Reimbursement amount must be a valid non-negative number.',
      path: ['lgu_reimbursementamount'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'LGU' &&
        (!data.lgu_reimbursementstatus ||
          data.lgu_reimbursementstatus.trim().length === 0)
      ),
    {
      error: 'Reimbursement status is required.',
      path: ['lgu_reimbursementstatus'],
    },
  )
  .refine(
    (data) =>
      !(
        data.plantype === 'LGU' &&
        data.lgu_reimbursementstatus &&
        data.lgu_reimbursementstatus.trim().length > 0 &&
        !lguCaseSchema.shape.reimbursementstatus.safeParse(
          data.lgu_reimbursementstatus,
        ).success
      ),
    {
      error: 'Please select a valid reimbursement status.',
      path: ['lgu_reimbursementstatus'],
    },
  );

function normalizeIntakeInput(data: Record<string, string | undefined>) {
  return {
    firstname: data.firstname ?? '',
    middlename: data.middlename ?? '',
    lastname: data.lastname ?? '',
    dateofdeath: data.dateofdeath ?? '',
    typeofdeath: data.typeofdeath ?? '',
    otherTypeOfDeath: data.otherTypeOfDeath ?? '',
    causeofdeath: data.causeofdeath ?? '',
    plantype: data.plantype ?? '',
    lifeplancompanyid: data.lifeplancompanyid ?? '',
    lifeplan_plannumber: data.lifeplan_plannumber ?? '',
    lifeplan_planholdername:
      data.lifeplan_planholdername ||
      [data.firstname, data.middlename, data.lastname]
        .filter(Boolean)
        .join(' '),
    lifeplan_totalamount: data.lifeplan_totalamount ?? '',
    lifeplan_use_benefits: data.lifeplan_use_benefits ?? 'true',
    lgu_reimbursementamount: data.lgu_reimbursementamount ?? '',
    lgu_reimbursementstatus: data.lgu_reimbursementstatus ?? '',
    rep_firstname: data.rep_firstname ?? '',
    rep_middlename: data.rep_middlename ?? '',
    rep_lastname: data.rep_lastname ?? '',
    rep_relationship: data.rep_relationship ?? '',
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
const INTAKE_FIELD_ORDER: (keyof ReturnType<typeof normalizeIntakeInput>)[] = [
  'firstname',
  'middlename',
  'lastname',
  'dateofdeath',
  'typeofdeath',
  'otherTypeOfDeath',
  'causeofdeath',
  'plantype',
  'lifeplancompanyid',
  'lifeplan_plannumber',
  'lifeplan_planholdername',
  'lifeplan_totalamount',
  'lifeplan_use_benefits',
  'lgu_reimbursementamount',
  'lgu_reimbursementstatus',
  'rep_firstname',
  'rep_middlename',
  'rep_lastname',
  'rep_relationship',
  'rep_contactnumber',
  'rep_address',
];

export function getFirstErrorField(errors: IntakeValidationErrors) {
  for (const field of INTAKE_FIELD_ORDER) if (errors[field]) return field;

  return null;
}
