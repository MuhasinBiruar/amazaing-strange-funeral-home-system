import { betterAuth } from 'better-auth';
import { username, admin } from 'better-auth/plugins';
import { Pool } from 'pg';
import { ac, user, admin as adminRole, superadmin } from './permissions';

/**
 * Better Auth server config.
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
      sameSite: 'none',
      secure: true, // Must be true when sameSite is "none"
    },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 50 }),
    admin({
      ac,
      roles: { user, admin: adminRole, superadmin },
      adminRoles: ['admin', 'superadmin'],
    }),
  ],
  trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
});
