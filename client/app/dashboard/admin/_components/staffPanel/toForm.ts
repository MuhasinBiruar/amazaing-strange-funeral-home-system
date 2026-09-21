import type { StaffDetail } from 'shared';
import type { FormState } from './types';

export function toForm(detail: StaffDetail): FormState {
  return {
    firstName: detail.firstName,
    middleName: detail.middleName ?? '',
    lastName: detail.lastName,
    contactNumber: detail.contactNumber ?? '',
    username: detail.username ?? '',
    jobRole: detail.jobRole ?? '',
    role: (detail.role ?? 'user') as 'admin' | 'user',
    isActive: detail.isActive,
    password: '',
    access: detail.access,
  };
}
