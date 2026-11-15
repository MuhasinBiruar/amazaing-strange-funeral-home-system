// Database side of the demo seeder: staff accounts, id allocation, inserts,
// the seeded-row manifest, reset, and post-seed consistency checks.

import type { PoolClient } from 'pg';
import pool from '@/db';
import { deleteDocumentFiles, uploadDocumentFile } from '@/lib/s3';
import { SERVICE_STATUS_TIMEZONE, UPDATE_SERVICE_STATUSES_SQL } from '@/lib/service-status';
import { upsertAccess } from '@/model/access';
import { withTransaction } from '@/util/with-transaction';
import { LIFEPLAN_COMPANIES, STAFF, type StaffKey } from './data';
import { placeholderPdf } from './pdf';
import { NOW_MARKER, TABLES, simulate, type Row, type Table } from './simulate';

const MANIFEST = 'public.seed_demo_row';

const PK: Record<Table, string> = {
  lifeplancompany: 'companyid',
  lgu: 'lguid',
  casketinventory: 'casketid',
  package: 'packageid',
  representative: 'representativeid',
  deceasedrecord: 'caseid',
  contract: 'contractid',
  lifeplan: 'planid',
  lgucase: 'lgucaseid',
  document: 'documentid',
  burialrecord: 'burialid',
  transaction: 'transactionid',
  officialreceipt: 'orid',
  formalininventory: 'formalinid',
  formalindelivery: 'deliveryid',
  formalinusage: 'usageid',
  casketdelivery: 'deliveryid',
  inventoryaudit: 'auditid',
  expense: 'expenseid',
  auditlog: 'auditlogid',
};

const FK: Partial<Record<Table, Record<string, Table>>> = {
  package: { casketid: 'casketinventory' },
  deceasedrecord: { representedby: 'representative' },
  contract: { caseid: 'deceasedrecord', packageid: 'package' },
  lifeplan: { caseid: 'deceasedrecord', companyid: 'lifeplancompany' },
  lgucase: { caseid: 'deceasedrecord', lguid: 'lgu' },
  document: { caseid: 'deceasedrecord' },
  burialrecord: { caseid: 'deceasedrecord' },
  transaction: { caseid: 'deceasedrecord' },
  officialreceipt: { transactionid: 'transaction' },
  formalindelivery: { formalinid: 'formalininventory' },
  formalinusage: { caseid: 'deceasedrecord', formalinid: 'formalininventory' },
  casketdelivery: { casketid: 'casketinventory' },
  inventoryaudit: { formalinid: 'formalininventory', casketid: 'casketinventory' },
};

/** Ids are handed out in this column's order, so they read chronologically. */
const ORDER_BY: Partial<Record<Table, string>> = {
  transaction: 'paymentdatetime',
  officialreceipt: 'issuedate',
  formalinusage: 'usagedate',
  formalindelivery: 'deliverydate',
  casketdelivery: 'deliverydate',
  expense: 'expensedate',
  auditlog: 'actiondate',
};

const q = (table: string) => `public."${table}"`;

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

async function ensureManifest() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ${MANIFEST} (
       tablename text NOT NULL,
       pk text NOT NULL,
       createdat timestamptz NOT NULL DEFAULT now(),
       PRIMARY KEY (tablename, pk)
     )`,
  );
}

async function manifestIds() {
  const exists = await pool.query<{ ok: boolean }>(`SELECT to_regclass($1) IS NOT NULL AS ok`, [MANIFEST]);
  if (!exists.rows[0].ok) return null;
  const result = await pool.query<{ tablename: string; pks: string[] }>(
    `SELECT tablename, array_agg(pk) AS pks FROM ${MANIFEST} GROUP BY tablename`,
  );
  return new Map(result.rows.map((r) => [r.tablename, r.pks]));
}

async function record(db: PoolClient | typeof pool, tablename: string, pks: (string | number)[]) {
  if (pks.length === 0) return;
  await db.query(
    `INSERT INTO ${MANIFEST} (tablename, pk) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`,
    [tablename, pks.map(String)],
  );
}

// ---------------------------------------------------------------------------
// Staff (through Better Auth so password hashes land in `account`)
// ---------------------------------------------------------------------------

async function createStaff(password: string) {
  const { auth } = await import('@/lib/auth');
  const byKey = {} as Record<StaffKey, { id: string; name: string }>;
  const created: string[] = [];

  try {
    for (const def of STAFF) {
      const clash = await pool.query(
        `SELECT 1 FROM staff WHERE lower("firstName") = lower($1) AND lower("lastName") = lower($2)`,
        [def.firstName, def.lastName],
      );
      if (clash.rows.length)
        throw new Error(`A staff member named ${def.firstName} ${def.lastName} already exists.`);

      const base = `${def.firstName[0]}${def.middleName[0]}${def.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = base;
      for (let n = 2; (await pool.query('SELECT 1 FROM staff WHERE username = $1', [username])).rows.length; n++)
        username = `${base}${n}`;

      const name = `${def.firstName} ${def.lastName}`;
      const result = await auth.api.createUser({
        body: {
          email: `${username}@staff.internal`,
          password,
          name,
          role: def.role,
          data: {
            firstName: def.firstName,
            middleName: def.middleName,
            lastName: def.lastName,
            isActive: true,
            contactNumber: def.contactNumber,
            username,
            ...(def.role === 'lifeplan_agent' ? {} : { jobRole: def.jobRole ?? 'staff' }),
          },
        },
      });
      const id = result.user.id;
      created.push(id);
      await record(pool, 'staff', [id]);
      if (def.access) await upsertAccess(id, def.access);
      byKey[def.key] = { id, name };
      console.log(`  staff  ${username.padEnd(12)} ${def.role.padEnd(15)} ${def.jobRole ?? ''}`);
    }
  } catch (error) {
    await removeStaff(created);
    throw error;
  }
  return { byKey, created };
}

async function removeStaff(ids: string[], db: PoolClient | typeof pool = pool) {
  if (ids.length === 0) return;
  await db.query('DELETE FROM access WHERE staffid = ANY($1::text[])', [ids]);
  await db.query('DELETE FROM lifeplan_agent WHERE staffid = ANY($1::text[])', [ids]);
  await db.query('DELETE FROM staff WHERE id = ANY($1::text[])', [ids]);
  await db.query(`DELETE FROM ${MANIFEST} WHERE tablename = 'staff' AND pk = ANY($1::text[])`, [ids]);
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function allocateIds(table: Table, count: number) {
  if (count === 0) return [];
  const result = await pool.query<{ id: number }>(
    `SELECT nextval(pg_get_serial_sequence($1, $2))::int AS id FROM generate_series(1, $3)`,
    [q(table), PK[table], count],
  );
  return result.rows.map((r) => r.id).sort((a, b) => a - b);
}

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await worker(items[next++]);
    }),
  );
}

export async function seedDemo(options: { password: string; seed: number; from: string; to: string; cap: number }) {
  await ensureManifest();
  const existing = await manifestIds();
  if (existing && existing.size > 0)
    throw new Error('Demo data is already seeded. Run with --reset first to remove it.');

  const lgu = await pool.query<{ ok: boolean }>(`SELECT to_regclass('public.lgu') IS NOT NULL AS ok`);
  if (!lgu.rows[0].ok) throw new Error('Table public.lgu is missing; the app needs it (see shared/src/schemas/db/lgu.ts).');

  const formalin = await pool.query<{ currentstock: number; minimumthreshold: number }>(
    `SELECT currentstock, minimumthreshold FROM formalininventory ORDER BY date DESC, formalinid DESC LIMIT 1`,
  );
  const usedOrs = new Set(
    (await pool.query<{ ornumber: string }>('SELECT ornumber FROM officialreceipt')).rows.map((r) => r.ornumber),
  );

  console.log('Creating staff accounts…');
  const { byKey, created: staffIds } = await createStaff(options.password);

  const { tables, stats } = simulate({
    seed: options.seed,
    from: options.from,
    to: options.to,
    cap: options.cap,
    staff: byKey,
    formalin: formalin.rows[0]
      ? { stock: Number(formalin.rows[0].currentstock), threshold: Number(formalin.rows[0].minimumthreshold) }
      : null,
  });

  // --- Local ids -> real ids -------------------------------------------------
  const realId = {} as Record<Table, number[]>;
  for (const table of TABLES) {
    const rows = tables[table];
    const ids = await allocateIds(table, rows.length);
    const orderCol = ORDER_BY[table];
    const order = orderCol
      ? [...rows].sort((a, b) => String(a[orderCol]).localeCompare(String(b[orderCol])) || a.id - b.id)
      : rows;
    realId[table] = [];
    order.forEach((row, i) => (realId[table][row.id] = ids[i]));
  }

  // OR numbers in issue order, continuing the existing booklet sequence.
  let orSeq = Math.max(0, ...[...usedOrs].map((o) => Number(/(\d+)$/.exec(o)?.[1] ?? 0)).filter(Number.isFinite));
  const orNumber: string[] = [];
  for (const row of [...tables.officialreceipt].sort((a, b) => String(a.issuedate).localeCompare(String(b.issuedate)))) {
    let candidate: string;
    do candidate = `OR-${String(++orSeq).padStart(6, '0')}`;
    while (usedOrs.has(candidate));
    usedOrs.add(candidate);
    orNumber[row.id] = candidate;
  }

  const uploads: { key: string; lines: string[] }[] = [];
  const nowIso = new Date().toISOString();
  const output = {} as Record<Table, Record<string, unknown>[]>;
  for (const table of TABLES) {
    output[table] = tables[table].map((row: Row) => {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (key === 'id' || key.startsWith('_')) continue;
        const ref = FK[table]?.[key];
        out[key] = ref && value !== null && value !== undefined ? realId[ref][value as number] : value;
      }
      out[PK[table]] = realId[table][row.id];
      if (out.date === NOW_MARKER) out.date = nowIso;
      if (table === 'officialreceipt') out.ornumber = orNumber[row.id];
      if (table === 'auditlog')
        out.action = String(out.action)
          .replace(/\{\{case:(\d+)\}\}/g, (_, id) => String(realId.deceasedrecord[Number(id)]))
          .replace(/\{\{or:(\d+)\}\}/g, (_, id) => orNumber[Number(id)]);
      if (table === 'document' && row._upload) {
        const key = `documents/${out.caseid}/${row._uuid}.pdf`;
        out.filename = key;
        uploads.push({
          key,
          lines: [
            String(row.documenttype),
            `Deceased: ${row._deceased}`,
            `Case #${out.caseid}`,
            'SAMPLE DOCUMENT - generated demo data, not a real record.',
          ],
        });
      }
      return out;
    });
  }

  // --- Files, then one transaction for every row ------------------------------
  console.log(`Uploading ${uploads.length} placeholder PDFs…`);
  const uploaded: string[] = [];
  try {
    let done = 0;
    await runPool(uploads, 8, async ({ key, lines }) => {
      await uploadDocumentFile(key, placeholderPdf(lines), 'application/pdf');
      uploaded.push(key);
      if (++done % 100 === 0) console.log(`  ${done}/${uploads.length}`);
    });

    console.log('Inserting rows…');
    await withTransaction(async (client) => {
      for (const table of TABLES) {
        const rows = output[table];
        if (rows.length === 0) continue;
        const columns = Object.keys(rows[0]).map((c) => `"${c}"`).join(', ');
        for (let i = 0; i < rows.length; i += 500) {
          await client.query(
            `INSERT INTO ${q(table)} (${columns})
             SELECT ${columns} FROM json_populate_recordset(NULL::${q(table)}, $1::json)`,
            [JSON.stringify(rows.slice(i, i + 500))],
          );
        }
        await record(client, table, realId[table].filter((id) => id !== undefined));
        if (table === 'lifeplancompany') {
          for (const def of STAFF.filter((s) => s.company !== undefined)) {
            const companyLocal = tables.lifeplancompany.findIndex(
              (r) => r.companyname === LIFEPLAN_COMPANIES[def.company!].companyname,
            );
            await client.query('INSERT INTO lifeplan_agent (staffid, companyid) VALUES ($1, $2)', [
              byKey[def.key].id,
              realId.lifeplancompany[companyLocal],
            ]);
          }
        }
      }
    });
  } catch (error) {
    console.error('Seeding failed, cleaning up…');
    await deleteDocumentFiles(uploaded).catch((e) => console.error('  could not delete uploaded files:', e));
    await removeStaff(staffIds).catch((e) => console.error('  could not delete staff:', e));
    throw error;
  }

  return { stats, counts: Object.fromEntries(TABLES.map((t) => [t, tables[t].length])), uploads: uploads.length };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

export async function resetDemo() {
  const manifest = await manifestIds();
  if (!manifest || manifest.size === 0) {
    console.log('No seeded demo data found.');
    return;
  }
  const ints = (t: string) => (manifest.get(t) ?? []).map(Number);
  const staff = manifest.get('staff') ?? [];
  const cases = ints('deceasedrecord');
  const ledger = ints('formalininventory');

  const files = await withTransaction(async (client) => {
    const del = (sql: string, params: unknown[]) => client.query(sql, params);

    const docFiles = await client.query<{ filename: string }>(
      'SELECT filename FROM document WHERE caseid = ANY($1::int[]) AND filename IS NOT NULL',
      [cases],
    );

    // Rows added through the app after seeding point at the seeded closing
    // ledger row; move them to the newest remaining one before deleting.
    const fallback = await client.query<{ formalinid: number }>(
      `SELECT formalinid FROM formalininventory WHERE NOT (formalinid = ANY($1::int[]))
       ORDER BY date DESC, formalinid DESC LIMIT 1`,
      [ledger],
    );
    if (fallback.rows[0]) {
      const target = fallback.rows[0].formalinid;
      for (const [table, pk] of [['formalinusage', 'usageid'], ['formalindelivery', 'deliveryid'], ['inventoryaudit', 'auditid']] as const)
        await client.query(
          `UPDATE ${table} SET formalinid = $1 WHERE formalinid = ANY($2::int[]) AND NOT (${pk} = ANY($3::int[]))`,
          [target, ledger, ints(table)],
        );
    }

    await del('DELETE FROM auditlog WHERE auditlogid = ANY($1::int[]) OR staffid = ANY($2::text[])', [ints('auditlog'), staff]);
    await del('DELETE FROM deletion WHERE deletedby = ANY($1::text[])', [staff]);
    // Case-scoped rows go by case, which also catches rows added in the app.
    await del('DELETE FROM "transaction" WHERE caseid = ANY($1::int[])', [cases]); // receipts cascade
    for (const table of ['document', 'burialrecord', 'formalinusage', 'contract', 'lifeplan', 'lgucase', 'notification'])
      await del(`DELETE FROM ${table} WHERE caseid = ANY($1::int[])`, [cases]);
    await del('DELETE FROM formalindelivery WHERE deliveryid = ANY($1::int[])', [ints('formalindelivery')]);
    await del('DELETE FROM inventoryaudit WHERE auditid = ANY($1::int[])', [ints('inventoryaudit')]);
    await del('DELETE FROM formalininventory WHERE formalinid = ANY($1::int[])', [ledger]);
    await del('DELETE FROM casketdelivery WHERE deliveryid = ANY($1::int[])', [ints('casketdelivery')]);
    await del('DELETE FROM deceasedrecord WHERE caseid = ANY($1::int[])', [cases]);
    await del('DELETE FROM representative WHERE representativeid = ANY($1::int[])', [ints('representative')]);
    await del('DELETE FROM package WHERE packageid = ANY($1::int[])', [ints('package')]);
    await del('DELETE FROM casketinventory WHERE casketid = ANY($1::int[])', [ints('casketinventory')]);
    await del('DELETE FROM expense WHERE expenseid = ANY($1::int[]) OR recordedby = ANY($2::text[])', [ints('expense'), staff]);
    await removeStaff(staff, client);
    await del('DELETE FROM lgu WHERE lguid = ANY($1::int[])', [ints('lgu')]);
    await del('DELETE FROM lifeplancompany WHERE companyid = ANY($1::int[])', [ints('lifeplancompany')]);
    await del(`DELETE FROM ${MANIFEST}`, []);
    return docFiles.rows.map((r) => r.filename);
  });

  await deleteDocumentFiles(files);
  console.log(`Removed demo data: ${cases.length} cases, ${staff.length} staff, ${files.length} files.`);
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

export async function verifyDemo() {
  const manifest = await manifestIds();
  const cases = (manifest?.get('deceasedrecord') ?? []).map(Number);
  if (cases.length === 0) {
    console.log('No seeded demo data to verify.');
    return true;
  }
  const problems: string[] = [];

  // 1. The status sweep must not want to change any seeded case.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const before = await client.query<{ caseid: number; servicestatus: string }>(
      'SELECT caseid, servicestatus FROM deceasedrecord WHERE caseid = ANY($1::int[])',
      [cases],
    );
    await client.query(UPDATE_SERVICE_STATUSES_SQL, [SERVICE_STATUS_TIMEZONE, null]);
    const after = await client.query<{ caseid: number; servicestatus: string }>(
      'SELECT caseid, servicestatus FROM deceasedrecord WHERE caseid = ANY($1::int[])',
      [cases],
    );
    const was = new Map(before.rows.map((r) => [r.caseid, r.servicestatus]));
    const changed = after.rows.filter((r) => was.get(r.caseid) !== r.servicestatus);
    if (changed.length)
      problems.push(
        `status sweep would change ${changed.length} case(s): ` +
          changed.slice(0, 5).map((r) => `#${r.caseid} ${was.get(r.caseid)}→${r.servicestatus}`).join(', '),
      );
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }

  const check = async (label: string, sql: string, params: unknown[] = [cases]) => {
    const result = await pool.query(sql, params);
    if (result.rows.length) problems.push(`${label}: ${JSON.stringify(result.rows.slice(0, 3))}`);
  };

  await check('negative casket stock', 'SELECT casketid, currentstock FROM casketinventory WHERE currentstock < 0', []);
  await check(
    'latest formalin row is not the seeded closing row',
    `SELECT formalinid FROM (SELECT formalinid FROM formalininventory ORDER BY date DESC, formalinid DESC LIMIT 1) t
     WHERE NOT EXISTS (SELECT 1 FROM ${MANIFEST} m WHERE m.tablename = 'formalininventory' AND m.pk = t.formalinid::text)`,
    [],
  );
  await check('negative formalin stock', 'SELECT formalinid FROM formalininventory WHERE currentstock < 0', []);
  await check(
    'last remaining balance does not match contract minus paid',
    `SELECT c.caseid, last.remainingbalance, c.totalamount, paid.net
     FROM contract c
     JOIN LATERAL (SELECT remainingbalance FROM "transaction" t WHERE t.caseid = c.caseid
                   ORDER BY paymentdatetime DESC, transactionid DESC LIMIT 1) last ON true
     JOIN (SELECT caseid, SUM(CASE WHEN paymentcategory = 'Refund' THEN -amount ELSE amount END) AS net
           FROM "transaction" GROUP BY caseid) paid ON paid.caseid = c.caseid
     WHERE c.caseid = ANY($1::int[]) AND last.remainingbalance <> GREATEST(c.totalamount - paid.net, 0)`,
  );
  await check(
    'completed case without completedat',
    `SELECT caseid FROM deceasedrecord WHERE caseid = ANY($1::int[]) AND servicestatus = 'completed' AND completedat IS NULL`,
  );
  await check(
    'payment dated in the future',
    `SELECT transactionid FROM "transaction" WHERE caseid = ANY($1::int[]) AND paymentdatetime > now()`,
  );
  await check(
    'burial date differs from contract deadline',
    `SELECT b.caseid FROM burialrecord b JOIN contract c USING (caseid)
     WHERE b.caseid = ANY($1::int[]) AND b.burialdate <> c.burialdatedeadline`,
  );

  if (problems.length) {
    console.error('\u{2716} Verification found problems:');
    for (const p of problems) console.error(`  - ${p}`);
    return false;
  }
  console.log(`\u{2714} Verification passed for ${cases.length} seeded cases.`);
  return true;
}
