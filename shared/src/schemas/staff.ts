import { z } from 'zod';
import withNullDefault from './util/with-null-default';
import contactNumberSchema from './util/contact-number-schema';
import nameSchema from './util/name-schema';
import passwordSchema from './util/password-schema';

export const createStaffQuerySchema = z.object({
  email: withNullDefault(
    z
      .email('Invalid email address')
      .max(255, 'Email must be at most 255 characters'),
  ),
  password: passwordSchema,
  role: z.enum(['admin', 'user']).default('user'),
  firstName: nameSchema('First name'),
  middleName: withNullDefault(nameSchema('Middle name')),
  lastName: nameSchema('Last name'),
  isActive: z.boolean().default(true),
  jobRole: z
    .string()
    .min(1)
    .max(255, 'Job role must be at most 255 characters')
    .nullable()
    .default('staff'),
  contactNumber: withNullDefault(contactNumberSchema),
});

export const updateStaffQuerySchema = createStaffQuerySchema.partial().extend({
  email: withNullDefault(
    z
      .email('Invalid email address')
      .max(255, 'Email must be at most 255 characters'),
  ),
  username: z
    .string()
    .max(255, 'Username must be at most 255 characters')
    .optional(),
  firstName: nameSchema('First name'),
  middleName: withNullDefault(nameSchema('Middle name')),
  lastName: nameSchema('Last name'),
  isActive: z.boolean().default(true),
  jobRole: z
    .string()
    .min(1)
    .max(255, 'Job role must be at most 255 characters')
    .nullable()
    .default('staff'),
  contactNumber: withNullDefault(contactNumberSchema),
});
export type CreateStaffQuery = z.infer<typeof createStaffQuerySchema>;
export type UpdateStaffQuery = z.infer<typeof updateStaffQuerySchema>;
