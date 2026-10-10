import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import { contactNumberSchema } from '@/utils/contact-number-schema';
import { nameSchema } from '@/utils/name-schema';
import { passwordSchema } from '@/utils/password-schema';
import {
  paginationQuerySchema,
  paginationResponseSchema,
} from '@/utils/pagination-schema';
import { updateAccessQuerySchema, DEFAULT_ACCESS } from './access';
import { withUndefinedDefault } from '@/utils/with-undefined-default';

const jobRoleString = z
  .string()
  .trim()
  .min(1)
  .max(255, 'Job role must be at most 255 characters');

export const staffRoleEnum = z.enum([
  'superadmin',
  'admin',
  'user',
  'lifeplan_agent',
]);
export type StaffRole = z.infer<typeof staffRoleEnum>;

export const assignableStaffRoleEnum = z.enum([
  'admin',
  'user',
  'lifeplan_agent',
]);
export type AssignableStaffRole = z.infer<typeof assignableStaffRoleEnum>;

/**
 * Only has columns that are actually used instead of being ignored.
 */
export const staffSchema = z.object({
  id: z.string().trim().min(1),
  firstName: nameSchema('First name'),
  middleName: withNullDefault(nameSchema('Middle name')),
  lastName: nameSchema('Last name'),
  isActive: z.boolean().default(true),
  jobRole: withNullDefault(jobRoleString).default('staff'),
  contactNumber: withNullDefault(contactNumberSchema),
  /** Automatically generated from firstName + middleName + lastName. */
  name: z.string().trim().min(1),
  /**
   * @remarks
   * Nullable in the database but user can't login without a username.
   */
  username: z.string().trim().toLowerCase().min(3).max(50),
  role: withNullDefault(staffRoleEnum),
});

export type Staff = z.infer<typeof staffSchema>;

export const staffWithAccessSchema = staffSchema.extend({
  access: updateAccessQuerySchema,
});

export type StaffWithAccess = z.infer<typeof staffWithAccessSchema>;

export const createStaffQuerySchema = staffWithAccessSchema
  .omit({ id: true, name: true, username: true })
  .extend({
    role: assignableStaffRoleEnum.default('user'),
    access: updateAccessQuerySchema.default(DEFAULT_ACCESS),
    password: passwordSchema,
    /** Required, and only used, when `role` is `lifeplan_agent`. */
    companyid: z.int32().positive().nullish(),
  })
  .refine((d) => d.role !== 'lifeplan_agent' || d.companyid != null, {
    message: 'Company is required for a life plan agent.',
    path: ['companyid'],
  });

export type CreateStaffQuery = z.infer<typeof createStaffQuerySchema>;

export const updateStaffQuerySchema = staffWithAccessSchema
  .omit({ id: true, name: true })
  .extend({
    isActive: z.boolean(),
    jobRole: jobRoleString,
    role: assignableStaffRoleEnum,
    access: updateAccessQuerySchema.partial(),
    password: withUndefinedDefault(passwordSchema),
  })
  .partial();

export type UpdateStaffQuery = z.infer<typeof updateStaffQuerySchema>;

export const getStaffRowSchema = staffWithAccessSchema.pick({
  id: true,
  name: true,
  username: true,
  role: true,
  jobRole: true,
  isActive: true,
  access: true,
});

export type GetStaffRow = z.infer<typeof getStaffRowSchema>;

export const getStaffQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.keyof(getStaffRowSchema).default('jobRole'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetStaffQuery = z.infer<typeof getStaffQuerySchema>;

export const getStaffResponseSchema = paginationResponseSchema.extend({
  data: z.array(getStaffRowSchema),
});

export type GetStaffResponse = z.infer<typeof getStaffResponseSchema>;
