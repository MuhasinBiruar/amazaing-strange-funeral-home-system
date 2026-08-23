import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';
import contactNumberSchema from './util/contact-number-schema.ts';
import nameSchema from './util/name-schema.ts';

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password must be under 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const staffSchema = z.object({
  email: withNullDefault(
    z
      .email("Invalid email address")
      .max(255, "Email must be at most 255 characters"),
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
    .max(255, "Job role must be at most 255 characters")
    .nullable()
    .default("staff"),
  contactNumber: withNullDefault(contactNumberSchema),
});

export type StaffSchemaType = z.infer<typeof staffSchema>;
