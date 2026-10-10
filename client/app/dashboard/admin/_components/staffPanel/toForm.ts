import type { StaffDetail, StaffRole } from 'shared';
import type { FormState } from './types';

export function toForm(detail: StaffDetail): FormState {
  return {
    firstName: detail.firstName,
    middleName: detail.middleName ?? '',
    lastName: detail.lastName,
    contactNumber: detail.contactNumber ?? '',
    username: detail.username ?? '',
    jobRole: detail.jobRole ?? '',
    role: (detail.role ?? 'user') as StaffRole,
    isActive: detail.isActive,
    password: '',
    access: detail.access,
    companyid: null,
  };
}
