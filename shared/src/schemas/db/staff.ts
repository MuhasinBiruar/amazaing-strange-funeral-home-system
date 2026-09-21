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

export const staffRoleEnum = z.enum(['admin', 'user']);

/**
 * Only has columns that are actually used instead of being ignored.
 */
export const staffSchema = z.object({
  id: z.string().trim().min(1),
  firstName: nameSchema('First name'),
  middleName: withNullDefault(nameSchema('Middle name')),
  lastName: nameSchema('Last name'),
  isActive: z.boolean().default(true),
  jobRole: withNullDefault(
    z
      .string()
      .trim()
      .min(1)
      .max(255, 'Job role must be at most 255 characters'),
  ).default('staff'),
  email: withNullDefault(
    z
      .email('Invalid email address')
      .max(255, 'Email must be at most 255 characters'),
  ),
  contactNumber: withNullDefault(contactNumberSchema),
  /** Automatically generated from firstName + middleName + lastName */
  name: z.string().trim().min(1),
  username: withNullDefault(z.string().trim().min(3).max(50)),
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
    role: staffRoleEnum.default('user'),
    access: updateAccessQuerySchema.default(DEFAULT_ACCESS),
    password: passwordSchema,
  });

export type CreateStaffQuery = z.infer<typeof createStaffQuerySchema>;

export const updateStaffQuerySchema = staffWithAccessSchema
  .omit({ id: true, name: true })
  .extend({
    access: updateAccessQuerySchema.partial(),
    password: passwordSchema,
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
