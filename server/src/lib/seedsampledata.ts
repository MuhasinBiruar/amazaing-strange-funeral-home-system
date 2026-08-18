// server/scripts/seed-sample-data.ts
//
// Run from the `server` workspace:
//   npx tsx scripts/seed-sample-data.ts
//
// Creates:
//   - 1 admin staff account (loggable-in)
//   - 1 regular staff account (loggable-in)
//   - 2 deceasedrecord rows, one managed by each staff member
//   - 2 document rows, one verified by each staff member
//
// Adjust the import path to `auth` below if your folder layout differs.

import 'dotenv/config';
import { Pool } from 'pg';
import { auth } from 'server/src/lib/auth.js';

// Reuse the same connection config your auth.ts uses, for the raw inserts below.
const pool = new Pool({
  host: process.env.HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  console.log('Creating admin staff account...');
  const admin = await auth.api.createUser({
    body: {
      email: 'jdsantos@staff.internal',
      password: 'AdminPass123!',
      name: 'Juan Santos',
      role: 'admin',
      data: {
        firstName: 'Juan',
        middleName: 'Dela',
        lastName: 'Santos',
        jobRole: 'admin',
        contactNumber: '09171234567',
        username: 'jdsantos',
      },
    },
  });
  console.log(
    '  Created:',
    admin.user.id,
    'username: jdsantos / password: AdminPass123!',
  );

  console.log('Creating regular staff account...');
  const staff = await auth.api.createUser({
    body: {
      email: 'mrreyes@staff.internal',
      password: 'StaffPass123!',
      name: 'Maria Reyes',
      role: 'user',
      data: {
        firstName: 'Maria',
        middleName: 'Ramos',
        lastName: 'Reyes',
        jobRole: 'staff',
        contactNumber: '09179876543',
        username: 'mrreyes',
      },
    },
  });
  console.log(
    '  Created:',
    staff.user.id,
    'username: mrreyes / password: StaffPass123!',
  );

  console.log('Inserting deceasedrecord rows...');
  const dr1 = await pool.query(
    `INSERT INTO deceasedrecord
      (firstname, middlename, lastname, causeofdeath, typeofdeath, physicaldescription, servicestatus, hasmaturedlifeplan, plantype, datecreated, managedby)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), $10)
     RETURNING caseid`,
    [
      'Pedro',
      'Cruz',
      'Garcia',
      'Cardiac arrest',
      'Natural',
      'Male, 5\'8"',
      'pending',
      false,
      'Direct',
      admin.user.id,
    ],
  );
  const dr2 = await pool.query(
    `INSERT INTO deceasedrecord
      (firstname, middlename, lastname, causeofdeath, typeofdeath, physicaldescription, servicestatus, hasmaturedlifeplan, plantype, datecreated, managedby)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), $10)
     RETURNING caseid`,
    [
      'Ana',
      'Lopez',
      'Torres',
      'Unknown',
      'Natural',
      'Female, 5\'4"',
      'active',
      true,
      'Life',
      staff.user.id,
    ],
  );
  console.log(
    '  Created caseid:',
    dr1.rows[0].caseid,
    'and',
    dr2.rows[0].caseid,
  );

  console.log('Inserting document rows...');
  await pool.query(
    `INSERT INTO document (documenttype, verificationstatus, uploaddate, verifiedby, caseid)
     VALUES ($1,$2, now(), $3, $4)`,
    ['Death Certificate', 'pending', admin.user.id, dr1.rows[0].caseid],
  );
  await pool.query(
    `INSERT INTO document (documenttype, verificationstatus, uploaddate, verifiedby, caseid)
     VALUES ($1,$2, now(), $3, $4)`,
    ['Burial Permit', 'verified', staff.user.id, dr2.rows[0].caseid],
  );
  console.log('  Documents created.');

  console.log('\nDone. Test logins:');
  console.log('  Admin  -> username: jdsantos  password: AdminPass123!');
  console.log('  Staff  -> username: mrreyes   password: StaffPass123!');
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seeding failed:', err);
    await pool.end();
    process.exit(1);
  });
