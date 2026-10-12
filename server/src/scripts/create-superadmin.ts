// Usage (from the `server` workspace):
//   SUPERADMIN_PASSWORD='...' npx tsx src/scripts/create-superadmin.ts [username] [firstName] [lastName]
//
// Creates the first superadmin, or promotes an existing user if
// SUPERADMIN_PROMOTE=<username> is set. Refuses to run if one already exists.

import 'dotenv/config';
import pool from '@/db';
import { auth } from '@/lib/auth';
import { passwordSchema } from 'shared/utils';

async function main() {
  const existing = await pool.query(
    `SELECT 1 FROM staff WHERE role = 'superadmin' LIMIT 1`,
  );
  if (existing.rows.length > 0) {
    console.log('A superadmin already exists. Nothing to do.');
    return;
  }

  const promote = process.env.SUPERADMIN_PROMOTE;
  if (promote) {
    const res = await pool.query(
      `UPDATE staff SET role = 'superadmin', "updatedAt" = NOW()
       WHERE username = $1 RETURNING id`,
      [promote],
    );
    if (res.rowCount === 0)
      throw new Error(`No staff with username "${promote}".`);
    console.log(`Promoted "${promote}" to superadmin.`);
    return;
  }

  const [username = 'superadmin', firstName = 'Super', lastName = 'Admin'] =
    process.argv.slice(2);
  const password = passwordSchema.parse(process.env.SUPERADMIN_PASSWORD);

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
  console.log(`Created superadmin "${username}".`);
}

main()
  .catch((err) => {
    console.error('Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
