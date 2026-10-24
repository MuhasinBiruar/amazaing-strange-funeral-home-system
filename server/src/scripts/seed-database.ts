// Usage (from the repo root):
//   npm run seed -w server -- --password "<superadmin password>" [options]
//
// Prepares an empty PostgreSQL database for the app. Safe to re-run: every
// step is skipped when it has already been done.
//
//   1. Creates all tables, enums, indexes and triggers (./schema.sql), but
//      only if `public.staff` doesn't exist yet. Existing data is never touched.
//   2. Creates (or updates) the public documents bucket named by S3_BUCKET,
//      when the database is Supabase.
//   3. Adds the initial formalin inventory row the Inventory page needs.
//   4. Creates the superadmin.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import pool from '@/db';
import { withTransaction } from '@/util/with-transaction';
import {
  SUPERADMIN_DEFAULTS,
  assertValidPassword,
  createSuperadmin,
  superadminExists,
} from './lib/superadmin';

const SCHEMA_PATH = fileURLToPath(new URL('./schema.sql', import.meta.url));

// Mirrors the limits enforced in src/middleware/upload.ts.
const BUCKET_FILE_SIZE_LIMIT_BYTES = 20 * 1024 * 1024;
const BUCKET_ALLOWED_MIME_TYPES = ['image/*', 'application/pdf'];

/** Liters. Editable later from "Record Formalin" on the Inventory page. */
const INITIAL_FORMALIN_MINIMUM_THRESHOLD = 60;

const USAGE = `Prepare an empty database: schema, storage bucket.

Usage:
  npm run seed -w server -- --password <password> [options]

Options:
  -p, --password <password>   Superadmin password. Required unless a superadmin
                              already exists or --skip-superadmin is given.
      --username <username>   Default: ${SUPERADMIN_DEFAULTS.username}
      --first-name <name>     Default: ${SUPERADMIN_DEFAULTS.firstName}
      --last-name <name>      Default: ${SUPERADMIN_DEFAULTS.lastName}
      --skip-superadmin       Don't create a superadmin.
      --skip-bucket           Don't create the storage bucket.
  -h, --help                  Show this message.
`;

async function relationExists(name: string) {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [name],
  );
  return result.rows[0].exists;
}

async function applySchema() {
  if (await relationExists('public.staff')) {
    console.log('\u{2714} Schema: already present, skipped.');
    return;
  }

  const sql = await readFile(SCHEMA_PATH, 'utf8');
  // One transaction: a failure leaves the database untouched.
  await withTransaction((client) => client.query(sql));
  console.log('\u{2714} Schema: created.');
}

async function ensureBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    console.warn('\u{26A0} Bucket: S3_BUCKET is not set, skipped.');
    return;
  }

  if (!(await relationExists('storage.buckets'))) {
    console.warn(
      `\u{26A0} Bucket: no "storage" schema (not Supabase?). Create a public bucket ` +
        `named "${bucket}" yourself (20 MB limit; image/* and application/pdf).`,
    );
    return;
  }

  await pool.query(
    `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
     VALUES ($1, $1, true, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       public = EXCLUDED.public,
       file_size_limit = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types`,
    [bucket, BUCKET_FILE_SIZE_LIMIT_BYTES, BUCKET_ALLOWED_MIME_TYPES],
  );
  console.log(
    `\u{2714} Bucket: "${bucket}" is ready (public, 20 MB, images/PDF).`,
  );
}

/**
 * The Inventory page can't load (and "Record Usage" can't open) until the
 * `formalininventory` table has at least one row.
 */
async function ensureFormalinInventory() {
  const result = await pool.query(
    `INSERT INTO formalininventory (currentstock, minimumthreshold)
     SELECT 0, $1
     WHERE NOT EXISTS (SELECT 1 FROM formalininventory)`,
    [INITIAL_FORMALIN_MINIMUM_THRESHOLD],
  );
  console.log(
    result.rowCount
      ? `\u{2714} Formalin inventory: initialised (0 L, minimum ${INITIAL_FORMALIN_MINIMUM_THRESHOLD} L).`
      : '\u{2714} Formalin inventory: already present, skipped.',
  );
}

async function ensureSuperadmin(options: {
  password?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (await superadminExists()) {
    console.log('\u{2714} Superadmin: already exists, skipped.');
    return;
  }

  if (!options.password)
    throw new Error(
      'No superadmin exists yet: pass --password <password> (or --skip-superadmin).',
    );

  const username = await createSuperadmin({
    ...options,
    password: options.password,
  });
  console.log(`\u{2714} Superadmin: created "${username}".`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      password: { type: 'string', short: 'p' },
      username: { type: 'string' },
      'first-name': { type: 'string' },
      'last-name': { type: 'string' },
      'skip-superadmin': { type: 'boolean' },
      'skip-bucket': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  // Fail on a bad password before changing anything.
  if (values.password !== undefined) assertValidPassword(values.password);

  await pool.query('SELECT 1'); // Clear error if the connection is wrong.

  await applySchema();
  if (!values['skip-bucket']) await ensureBucket();
  await ensureFormalinInventory();
  if (!values['skip-superadmin'])
    await ensureSuperadmin({
      password: values.password,
      username: values.username,
      firstName: values['first-name'],
      lastName: values['last-name'],
    });

  console.log('\nDone. Start the app with `npm run dev:all`.');
}

main()
  .catch((err) => {
    console.error('\nSeed failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    process.exit(process.exitCode ?? 0);
  });
