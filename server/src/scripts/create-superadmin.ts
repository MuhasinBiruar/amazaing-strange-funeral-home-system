// Usage (from the repo root):
//   npm run create-superadmin -w server -- --password "<password>" [options]
//   npm run create-superadmin -w server -- --promote <username>
//
// Creates the first superadmin, or promotes an existing staff account with
// --promote. Refuses to run if a superadmin already exists. Run with --help
// for all options.

import { parseArgs } from 'node:util';
import pool from '@/db';
import {
  SUPERADMIN_DEFAULTS,
  createSuperadmin,
  promoteToSuperadmin,
  superadminExists,
} from './lib/superadmin';

const USAGE = `Create the first superadmin, or promote an existing staff account.

Usage:
  npm run create-superadmin -w server -- --password <password> [options]
  npm run create-superadmin -w server -- --promote <username>

Options:
  -p, --password <password>   Password for the new superadmin (required unless --promote).
      --username <username>   Default: ${SUPERADMIN_DEFAULTS.username}
      --first-name <name>     Default: ${SUPERADMIN_DEFAULTS.firstName}
      --last-name <name>      Default: ${SUPERADMIN_DEFAULTS.lastName}
      --promote <username>    Promote this existing account instead of creating one.
  -h, --help                  Show this message.
`;

async function main() {
  const { values } = parseArgs({
    options: {
      password: { type: 'string', short: 'p' },
      username: { type: 'string' },
      'first-name': { type: 'string' },
      'last-name': { type: 'string' },
      promote: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  if (await superadminExists()) {
    console.log('A superadmin already exists. Nothing to do.');
    return;
  }

  if (values.promote) {
    await promoteToSuperadmin(values.promote);
    console.log(`Promoted "${values.promote}" to superadmin.`);
    return;
  }

  if (!values.password) {
    throw new Error('--password is required (or use --promote <username>).');
  }

  const username = await createSuperadmin({
    password: values.password,
    username: values.username,
    firstName: values['first-name'],
    lastName: values['last-name'],
  });
  console.log(`Created superadmin "${username}".`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    console.error('\nRun with --help for usage.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    process.exit(process.exitCode ?? 0);
  });
