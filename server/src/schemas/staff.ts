import { z } from 'zod';
import withNullDefault from './util/with-null-default.ts';

function nameSchema(fieldName: string) {
  return z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(255, `${fieldName} must be at most 255 characters`)
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
      `${fieldName} contains invalid characters`,
    );
}

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be under 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

export const staffSchema = z.object({
  email: z
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters'),
  password: passwordSchema,
  role: z.enum(['admin', 'user']).default('user'),
  firstName: nameSchema('First name'),
  middleName: withNullDefault(nameSchema('Middle name')),
  lastName: nameSchema('Last name'),
  jobRole: z
    .string()
    .min(1)
    .max(255, 'Job role must be at most 255 characters')
    .default('staff'),
  contactNumber: withNullDefault(
    z
      .string()
      .transform((val) => val.replace(/[\s\-()]/g, ''))
      .pipe(
        z
          .string()
          .regex(
            /^(09\d{9}|\+[1-9]\d{1,14})$/,
            'Must be a valid local number (e.g., 09123456789) or international format (e.g., +14155552671)',
          )
          .transform((val) => {
            // 3. Convert clean local PH numbers to +63 format, leave others alone
            if (val.startsWith('09')) {
              return '+63' + val.substring(1);
            }
            return val;
          }),
      ),
  ),
});

export type StaffSchemaType = z.infer<typeof staffSchema>;
