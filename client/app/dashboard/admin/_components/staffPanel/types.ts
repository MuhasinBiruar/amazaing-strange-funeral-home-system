import { DEFAULT_ACCESS, type StaffRole, type UpdateAccessQuery } from 'shared';

export type PanelMode = 'create' | 'edit';

export interface FormState {
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
  username: string;
  jobRole: string;
  role: StaffRole;
  isActive: boolean;
  password: string;
  access: UpdateAccessQuery;
  companyid: number | null;
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
    companyid: null,
  };
}

export type ValidationErrors = Partial<Record<keyof FormState, string>>;
