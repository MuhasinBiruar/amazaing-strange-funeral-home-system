// Usage (from the repo root):
//   npm run seed:demo -w server -- [--password <pw>] [options]
//
// Appends ~6 months of realistic, internally consistent demo data (cases,
// contracts, payments + receipts, life plans, LGU cases, documents with
// placeholder PDFs, burial records, casket & formalin inventory, expenses and
// audit log entries) alongside whatever is already in the database.
//
// Every seeded row is listed in `public.seed_demo_row`, so `--reset` removes
// exactly the demo data (and its uploaded files) and nothing else.

import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import pool from '@/db';
import { assertValidPassword } from './lib/superadmin';
import { STAFF } from './lib/demo/data';
import { addDays, manilaTime, todayInManila } from './lib/demo/random';
import { resetDemo, seedDemo, verifyDemo } from './lib/demo/write';

const USAGE = `Seed ~6 months of demo data.

Usage:
  npm run seed:demo -w server -- [options]

Options:
  -p, --password <pw>   Password for the ${STAFF.length} demo staff accounts.
                        Generated and printed when omitted.
      --from <date>     First day (YYYY-MM-DD). Default: 6 months before --to.
      --to <date>       Last day (YYYY-MM-DD). Default: today in Manila.
      --seed <n>        Random seed (default 20261115). Same seed, same data.
      --reset           Remove all seeded demo data and its files, then exit.
      --verify          Only run the consistency checks on seeded data.
  -h, --help            Show this message.
`;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function sixMonthsBefore(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  const month = m - 6 <= 0 ? m + 6 : m - 6;
  const year = m - 6 <= 0 ? y - 1 : y;
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      password: { type: 'string', short: 'p' },
      from: { type: 'string' },
      to: { type: 'string' },
      seed: { type: 'string' },
      reset: { type: 'boolean' },
      verify: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) return console.log(USAGE);

  await pool.query('SELECT 1');

  if (values.reset) return resetDemo();
  if (values.verify) {
    if (!(await verifyDemo())) process.exitCode = 1;
    return;
  }

  const today = todayInManila();
  const to = values.to ?? today;
  const from = values.from ?? sixMonthsBefore(to);
  if (!DATE.test(to) || !DATE.test(from) || from > to) throw new Error('--from/--to must be YYYY-MM-DD with from <= to.');
  if (to > today) throw new Error(`--to (${to}) is after today (${today}).`);
  if (to < today)
    console.warn(`\u{26A0} --to is before today: the server's status sweep evaluates deadlines against today (${today}).`);

  const password = values.password ?? `Demo#${randomBytes(5).toString('hex')}9X`;
  assertValidPassword(password);

  const seed = Number(values.seed ?? 20261115);
  // Nothing may be dated after the end of --to, nor after this moment.
  const cap = Math.min(manilaTime(addDays(to, 1), 0) - 1, Date.now() - 60_000);

  console.log(`Seeding demo data for ${from} → ${to} (seed ${seed})…`);
  const { stats, counts, uploads } = await seedDemo({ password, seed, from, to, cap });

  console.log('\nRows inserted:');
  for (const [table, n] of Object.entries(counts)) console.log(`  ${table.padEnd(18)} ${n}`);
  console.log(`  ${'files uploaded'.padEnd(18)} ${uploads}`);
  console.log('\nBreakdown:');
  for (const [key, n] of Object.entries(stats).sort()) console.log(`  ${key.padEnd(24)} ${n}`);
  console.log(`\nDemo staff password: ${password}${values.password ? '' : '  (generated)'}`);

  console.log('');
  if (!(await verifyDemo())) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('\nDemo seed failed:', err instanceof Error ? err.stack ?? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    process.exit(process.exitCode ?? 0);
  });
