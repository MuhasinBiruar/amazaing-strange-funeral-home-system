import { createStaffQuerySchema, updateStaffQuerySchema } from 'shared';
import type { ValidationErrors, FormState } from './types';

export async function validateFields(
  state: FormState,
  mode: 'create' | 'edit',
) {
  let result;
  switch (mode) {
    case 'create':
      result = await createStaffQuerySchema.safeParseAsync(state);
      break;
    default:
    case 'edit':
      result = await updateStaffQuerySchema.safeParseAsync(state);
      break;
  }

  if (result.success) return {};

  const errors: ValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);

    // Keep only the first failing rule per field
    if (!(field in errors))
      errors[field as keyof ValidationErrors] = issue.message;
  }
  return errors;
}
