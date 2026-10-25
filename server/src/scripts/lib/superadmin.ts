import pool from '@/db';
import { passwordSchema } from 'shared/utils';

export const SUPERADMIN_DEFAULTS = {
  username: 'superadmin',
  firstName: 'Super',
  lastName: 'Admin',
} as const;

/** Throws an `Error` listing every rule the password breaks. */
export function assertValidPassword(password: string) {
  const result = passwordSchema.safeParse(password);
  if (result.success) return;

  throw new Error(
    `Invalid password:\n${result.error.issues
      .map((issue) => `  - ${issue.message}`)
      .join('\n')}`,
  );
}

/** The database allows at most one superadmin (`staff_single_superadmin`). */
export async function superadminExists() {
  const result = await pool.query(
    `SELECT 1 FROM staff WHERE role = 'superadmin' LIMIT 1`,
  );
  return result.rows.length > 0;
}

/** Creates the superadmin account through Better Auth. */
export async function createSuperadmin({
  password,
  username = SUPERADMIN_DEFAULTS.username,
  firstName = SUPERADMIN_DEFAULTS.firstName,
  lastName = SUPERADMIN_DEFAULTS.lastName,
}: {
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  assertValidPassword(password);

  // Imported lazily: Better Auth checks the database schema as soon as this
  // module loads, which would fail in the seed script before it has created
  // the tables.
  const { auth } = await import('@/lib/auth');

  await auth.api.createUser({
    body: {
      email: `${username}@staff.internal`,
      password,
      name: `${firstName} ${lastName}`,
      role: 'superadmin',
      data: {
        firstName,
        lastName,
        isActive: true,
        jobRole: 'superadmin',
        username,
      },
    },
  });

  return username;
}

/** Promotes an existing staff account to superadmin. */
export async function promoteToSuperadmin(username: string) {
  const result = await pool.query(
    `UPDATE staff SET role = 'superadmin', "updatedAt" = NOW()
     WHERE username = $1 RETURNING id`,
    [username],
  );
  if (result.rowCount === 0)
    throw new Error(`No staff with username "${username}".`);
}
