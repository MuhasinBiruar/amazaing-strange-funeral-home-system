import z from 'zod';
import { withNullDefault } from '@/utils/with-null-default';
import { contactNumberSchema } from '@/utils/contact-number-schema';
import { nameSchema } from '@/utils/name-schema';
import { passwordSchema } from '@/utils/password-schema';

const STAFF_ROLES = z.enum(['admin', 'user']);

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
  /**
   * Automatically generated from firstName + middleName + lastName
   */
  name: z.string().trim().min(1),
  username: withNullDefault(z.string().trim().min(3).max(50)),
  role: withNullDefault(STAFF_ROLES),
});

export type Staff = z.infer<typeof staffSchema>;

export const createStaffQuerySchema = staffSchema
  .omit({
    id: true,
    name: true,
    username: true,
  })
  .extend({
    role: STAFF_ROLES.default('user'),
    password: passwordSchema,
  });

export type CreateStaffQuery = z.infer<typeof createStaffQuerySchema>;

export const updateStaffQuerySchema = staffSchema
  .omit({
    id: true,
    name: true,
  })
  .partial({
    firstName: true,
    middleName: true,
    lastName: true,
    isActive: true,
    jobRole: true,
    email: true,
    contactNumber: true,
    username: true,
    role: true,
  })
  .extend({
    password: passwordSchema.optional(),
  });

export type UpdateStaffQuery = z.infer<typeof updateStaffQuerySchema>;
