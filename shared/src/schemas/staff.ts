import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';
import contactNumberSchema from './util/contact-number-schema.ts';
import nameSchema from './util/name-schema.ts';
import passwordSchema from './util/password-schema.ts';

export const staffSchema = z.object({
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

export type Staff = z.infer<typeof staffSchema>;
