import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { username } from 'better-auth/plugins';
import { admin } from 'better-auth/plugins';

/**
 * Better Auth server configuration for the funeral home system.
 *
 * @todo Replace the `adminUserIds` placeholder with the real staff ID
 * of the first seeded admin account.
 */

export const auth = betterAuth({
  database: new Pool({
    host: process.env.HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  }),
  user: {
    modelName: 'staff',
    fields: {
      createdAt: 'dateCreated',
    },
    additionalFields: {
      firstName: { type: 'string', required: true },
      middleName: { type: 'string', required: false },
      lastName: { type: 'string', required: true },
      isActive: { type: 'boolean', required: false, defaultValue: true },
      jobRole: { type: 'string', required: false, defaultValue: 'staff' },
      contactNumber: { type: 'string', required: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: true,
    },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 50 }),
    admin({
      adminUserIds: ['O3sFnqtpALcn9WC2aUXXWQXwN87wrKeJ'],
    }),
  ],
  trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
});
