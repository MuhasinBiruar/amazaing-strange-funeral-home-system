import { DEFAULT_ACCESS, type UpdateAccessQuery } from 'shared';

export interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  username: string;
  jobRole: string;
  role: 'admin' | 'user';
  isActive: boolean;
  password: string;
  access: UpdateAccessQuery;
}

/**
 * Generic field setter shared by every section of the form.
 */
export type UpdateField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

export function emptyForm(): FormState {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    username: '',
    jobRole: '',
    role: 'user',
    isActive: true,
    password: '',
    access: DEFAULT_ACCESS,
  };
}

export type AdminValidationErrors = Partial<Record<keyof FormState, string>>;
