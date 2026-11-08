import type { PoolClient } from 'pg';
import type { DeletionEntityType } from 'shared';
import { ConflictError, NotFoundError } from '@/errors';
import { assertCasketCanBeDeleted } from '@/model/casketinventory';

/** One table's rows removed along with a deleted record. */
export interface SnapshotTable {
  table: string;
  /** Primary key column. */
  key: string;
  rows: Record<string, unknown>[];
  /**
   * Restored with `ON CONFLICT DO NOTHING`, because another restore may
   * already have put it back (e.g. a representative shared by two cases).
   */
  shared?: boolean;
  /** Saved for restoring but not deleted, because something else still uses it. */
  keep?: boolean;
}

export interface CollectedRecord {
  label: string;
  /** In insert order: parents before the rows that reference them. */
  tables: SnapshotTable[];
  /** Storage keys of uploaded files, removed only when the entry is purged. */
  files: string[];
}

interface EntityDefinition {
  /** The table the record itself lives in. */
  table: string;
  /**
   * Locks and gathers the record and everything deleted with it. Throws a
   * `ConflictError` if the record is still in use and can't be deleted.
   */
  collect: (client: PoolClient, id: number) => Promise<CollectedRecord>;
  /** Side effects of deleting it, e.g. taking delivered stock back out. */
  onDelete?: (client: PoolClient, tables: SnapshotTable[]) => Promise<void>;
  /** Reverses {@link onDelete} after the rows are back. */
  onRestore?: (client: PoolClient, tables: SnapshotTable[]) => Promise<void>;
}

/** Singular and plural names for tables, used in summaries and errors. */
export const TABLE_NAMES: Record<string, [string, string]> = {
  representative: ['representative', 'representatives'],
  deceasedrecord: ['case', 'cases'],
  burialrecord: ['burial record', 'burial records'],
  contract: ['contract', 'contracts'],
  document: ['document', 'documents'],
  lgucase: ['LGU record', 'LGU records'],
  lifeplan: ['life plan', 'life plans'],
  transaction: ['payment', 'payments'],
  officialreceipt: ['official receipt', 'official receipts'],
  formalinusage: ['formalin usage', 'formalin usages'],
  expense: ['expense', 'expenses'],
  casketdelivery: ['casket delivery', 'casket deliveries'],
  formalindelivery: ['formalin delivery', 'formalin deliveries'],
  casketinventory: ['casket', 'caskets'],
  formalininventory: ['formalin stock entry', 'formalin stock entries'],
  package: ['package', 'packages'],
  lgu: ['LGU', 'LGUs'],
  lifeplancompany: ['life plan company', 'life plan companies'],
  staff: ['staff account', 'staff accounts'],
};

/** Every row of `table` matching `where`, as plain JSON objects. */
async function selectRows(
  client: PoolClient,
  table: string,
  key: string,
  where: string,
  params: unknown[],
): Promise<SnapshotTable> {
  const result = await client.query<{ row: Record<string, unknown> }>(
    `SELECT to_jsonb(t) AS row FROM public.${table} t WHERE ${where} ORDER BY t.${key}`,
    params,
  );
  return { table, key, rows: result.rows.map((r) => r.row) };
}

function plural(count: number, [singular, many]: [string, string]) {
  return `${count} ${count === 1 ? singular : many}`;
}

function peso(amount: unknown) {
  return `₱${Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats a `yyyy-mm-dd` date (or a timestamp) as e.g. "Oct 5, 2026". */
function day(value: unknown) {
  const text = String(value);
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text,
  );
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(text) ? 'UTC' : 'Asia/Manila',
  });
}

/** The one row a single-row snapshot holds. */
function rootRow(tables: SnapshotTable[]) {
  return tables[0].rows[0];
}

/**
 * Appends a formalin ledger entry that changes the current stock by `change`
 * liters, the same way deliveries and usage do.
 *
 * @param action What the change is for, for the error when stock would go
 * negative, e.g. "removing this delivery".
 */
async function adjustFormalinStock(
  client: PoolClient,
  change: number,
  action: string,
) {
  await client.query(
    `SELECT pg_advisory_xact_lock(hashtext('formalininventory'))`,
  );
  const latestResult = await client.query(
    `SELECT currentstock, minimumthreshold
     FROM formalininventory
     ORDER BY date DESC, formalinid DESC
     LIMIT 1
     FOR UPDATE`,
  );
  const latest = latestResult.rows[0] ?? {
    currentstock: 0,
    minimumthreshold: 0,
  };
  const currentStock = Number(latest.currentstock);
  const newStock = currentStock + change;

  if (newStock < 0) {
    throw new ConflictError(
      `Only ${currentStock} liters of formalin are in stock, so ${action} would make the stock negative.`,
    );
  }

  await client.query(
    `INSERT INTO formalininventory (currentstock, minimumthreshold, date)
     VALUES ($1, $2, now())`,
    [newStock, Number(latest.minimumthreshold)],
  );
}

/** Changes a casket's stock by `change`, refusing to go below zero. */
async function adjustCasketStock(
  client: PoolClient,
  casketid: number,
  change: number,
  action: string,
) {
  const result = await client.query(
    `UPDATE casketinventory SET currentstock = currentstock + $1
     WHERE casketid = $2 AND currentstock + $1 >= 0
     RETURNING casketid`,
    [change, casketid],
  );
  if (result.rows.length > 0) return;

  const casket = await client.query(
    'SELECT caskettype, currentstock FROM casketinventory WHERE casketid = $1',
    [casketid],
  );
  if (casket.rows.length === 0) return;
  const { caskettype, currentstock } = casket.rows[0];
  throw new ConflictError(
    `Only ${currentstock} ${caskettype} ${currentstock === 1 ? 'is' : 'are'} in stock, so ${action} would make the stock negative.`,
  );
}

/** Rows a deleted case takes with it, in insert order, after the case itself. */
const CASE_CHILD_TABLES: [table: string, key: string][] = [
  ['burialrecord', 'burialid'],
  ['contract', 'contractid'],
  ['document', 'documentid'],
  ['lgucase', 'lgucaseid'],
  ['lifeplan', 'planid'],
  ['transaction', 'transactionid'],
];

export const ENTITIES: Record<DeletionEntityType, EntityDefinition> = {
  /**
   * A deceased record and everything about it: its contract, documents,
   * payments and receipts, burial record, LGU or life plan record, and
   * formalin usage. Its representative goes too unless another case still
   * names them. Stock isn't changed: the casket and formalin were used.
   */
  case: {
    table: 'deceasedrecord',
    async collect(client, caseid) {
      const caseResult = await client.query(
        `SELECT
           to_jsonb(dr) AS row,
           CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS name
         FROM deceasedrecord dr
         WHERE dr.caseid = $1
         FOR UPDATE`,
        [caseid],
      );
      if (caseResult.rows.length === 0)
        throw new NotFoundError('This case no longer exists.');
      const { row, name } = caseResult.rows[0];

      const tables: SnapshotTable[] = [];

      if (row.representedby !== null) {
        const representative = await selectRows(
          client,
          'representative',
          'representativeid',
          't.representativeid = $1',
          [row.representedby],
        );
        const otherCases = await client.query(
          `SELECT 1 FROM deceasedrecord
           WHERE representedby = $1 AND caseid <> $2
           LIMIT 1`,
          [row.representedby, caseid],
        );
        tables.push({
          ...representative,
          shared: true,
          keep: otherCases.rows.length > 0,
        });
      }

      tables.push({ table: 'deceasedrecord', key: 'caseid', rows: [row] });

      for (const [table, key] of CASE_CHILD_TABLES) {
        tables.push(
          await selectRows(client, table, key, 't.caseid = $1', [caseid]),
        );
      }
      tables.push(
        await selectRows(
          client,
          'officialreceipt',
          'orid',
          't.transactionid IN (SELECT transactionid FROM transaction WHERE caseid = $1)',
          [caseid],
        ),
        await selectRows(client, 'formalinusage', 'usageid', 't.caseid = $1', [
          caseid,
        ]),
      );

      const files = tables
        .find((t) => t.table === 'document')!
        .rows.map((document) => document.filename)
        .filter((filename): filename is string => typeof filename === 'string');

      return { label: `${name} (case #${caseid})`, tables, files };
    },
  },

  expense: {
    table: 'expense',
    async collect(client, expenseid) {
      const result = await client.query(
        'SELECT to_jsonb(e) AS row FROM expense e WHERE expenseid = $1 FOR UPDATE',
        [expenseid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This expense no longer exists.');
      const { row } = result.rows[0];

      return {
        label: `${row.description} (${peso(row.amount)})`,
        tables: [{ table: 'expense', key: 'expenseid', rows: [row] }],
        files: [],
      };
    },
  },

  /** Also takes the delivered caskets back out of stock. */
  casketdelivery: {
    table: 'casketdelivery',
    async collect(client, deliveryid) {
      const result = await client.query(
        `SELECT to_jsonb(cd) AS row, ci.caskettype
         FROM casketdelivery cd
         LEFT JOIN casketinventory ci ON ci.casketid = cd.casketid
         WHERE cd.deliveryid = $1
         FOR UPDATE OF cd`,
        [deliveryid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This casket delivery no longer exists.');
      const { row, caskettype } = result.rows[0];

      return {
        label: `${row.quantityreceived}x ${caskettype ?? 'casket'} delivered ${day(row.deliverydate)}`,
        tables: [{ table: 'casketdelivery', key: 'deliveryid', rows: [row] }],
        files: [],
      };
    },
    async onDelete(client, tables) {
      const { casketid, quantityreceived } = rootRow(tables);
      if (casketid === null) return;
      await adjustCasketStock(
        client,
        Number(casketid),
        -Number(quantityreceived),
        'removing this delivery',
      );
    },
    async onRestore(client, tables) {
      const { casketid, quantityreceived } = rootRow(tables);
      if (casketid === null) return;
      await adjustCasketStock(
        client,
        Number(casketid),
        Number(quantityreceived),
        'restoring this delivery',
      );
    },
  },

  /** Also takes the delivered formalin back out of stock. */
  formalindelivery: {
    table: 'formalindelivery',
    async collect(client, deliveryid) {
      const result = await client.query(
        `SELECT to_jsonb(fd) AS row FROM formalindelivery fd
         WHERE deliveryid = $1 FOR UPDATE`,
        [deliveryid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This formalin delivery no longer exists.');
      const { row } = result.rows[0];

      return {
        label: `${row.quantityreceived} L of formalin delivered ${day(row.deliverydate)}`,
        tables: [{ table: 'formalindelivery', key: 'deliveryid', rows: [row] }],
        files: [],
      };
    },
    async onDelete(client, tables) {
      await adjustFormalinStock(
        client,
        -Number(rootRow(tables).quantityreceived),
        'removing this delivery',
      );
    },
    async onRestore(client, tables) {
      await adjustFormalinStock(
        client,
        Number(rootRow(tables).quantityreceived),
        'restoring this delivery',
      );
    },
  },

  /** Also puts the used formalin back into stock. */
  formalinusage: {
    table: 'formalinusage',
    async collect(client, usageid) {
      const result = await client.query(
        `SELECT
           to_jsonb(fu) AS row,
           CONCAT_WS(' ', NULLIF(dr.firstname, ''), NULLIF(dr.middlename, ''), NULLIF(dr.lastname, '')) AS name
         FROM formalinusage fu
         JOIN deceasedrecord dr ON dr.caseid = fu.caseid
         WHERE fu.usageid = $1
         FOR UPDATE OF fu`,
        [usageid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This formalin usage no longer exists.');
      const { row, name } = result.rows[0];

      return {
        label: `${row.quantityused} L of formalin used for ${name} on ${day(row.usagedate)}`,
        tables: [{ table: 'formalinusage', key: 'usageid', rows: [row] }],
        files: [],
      };
    },
    async onDelete(client, tables) {
      await adjustFormalinStock(
        client,
        Number(rootRow(tables).quantityused),
        'removing this usage',
      );
    },
    async onRestore(client, tables) {
      await adjustFormalinStock(
        client,
        -Number(rootRow(tables).quantityused),
        'restoring this usage',
      );
    },
  },

  /** Only a casket no package, delivery, or audit refers to. */
  casketinventory: {
    table: 'casketinventory',
    async collect(client, casketid) {
      const caskettype = await assertCasketCanBeDeleted(
        client,
        String(casketid),
      );
      const casket = await selectRows(
        client,
        'casketinventory',
        'casketid',
        't.casketid = $1',
        [casketid],
      );
      return { label: caskettype, tables: [casket], files: [] };
    },
  },

  package: {
    table: 'package',
    async collect(client, packageid) {
      const result = await client.query(
        `SELECT to_jsonb(p) AS row
         FROM package p
         WHERE p.packageid = $1
         FOR UPDATE`,
        [packageid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This package no longer exists.');

      const { row } = result.rows[0];
      const contracts = await client.query(
        'SELECT 1 FROM contract WHERE packageid = $1 LIMIT 1',
        [packageid],
      );
      if (contracts.rows.length > 0)
        throw new ConflictError(
          `${row.packagename} cannot be deleted because it is used by a contract.`,
        );

      return {
        label: `${row.packagename} (${row.packagetype})`,
        tables: [{ table: 'package', key: 'packageid', rows: [row] }],
        files: [],
      };
    },
  },

  /** Only an LGU no case is filed under. */
  lgu: {
    table: 'lgu',
    async collect(client, lguid) {
      const result = await client.query(
        'SELECT to_jsonb(l) AS row FROM lgu l WHERE lguid = $1 FOR UPDATE',
        [lguid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This LGU no longer exists.');
      const { row } = result.rows[0];

      const usage = await client.query<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM lgucase WHERE lguid = $1',
        [lguid],
      );
      const { count } = usage.rows[0];
      if (count > 0) {
        throw new ConflictError(
          `${row.lguname} can't be deleted because ${plural(count, ['case is', 'cases are'])} filed under it. Delete or move ${count === 1 ? 'that case' : 'those cases'} first.`,
        );
      }

      return {
        label: row.lguname,
        tables: [{ table: 'lgu', key: 'lguid', rows: [row] }],
        files: [],
      };
    },
  },

  /** Only a company with no life plans and no agent accounts. */
  lifeplancompany: {
    table: 'lifeplancompany',
    async collect(client, companyid) {
      const result = await client.query(
        `SELECT to_jsonb(c) AS row FROM lifeplancompany c
         WHERE companyid = $1 FOR UPDATE`,
        [companyid],
      );
      if (result.rows.length === 0)
        throw new NotFoundError('This life plan company no longer exists.');
      const { row } = result.rows[0];

      const usage = await client.query<{ plans: number; agents: number }>(
        `SELECT
           (SELECT COUNT(*)::int FROM lifeplan WHERE companyid = $1) AS plans,
           (SELECT COUNT(*)::int FROM lifeplan_agent WHERE companyid = $1) AS agents`,
        [companyid],
      );
      const { plans, agents } = usage.rows[0];
      if (plans > 0 || agents > 0) {
        const uses = [
          plans > 0 && plural(plans, ['life plan', 'life plans']),
          agents > 0 && plural(agents, ['agent account', 'agent accounts']),
        ].filter(Boolean);
        throw new ConflictError(
          `${row.companyname} can't be deleted because it still has ${uses.join(' and ')}. Delete or reassign ${plans + agents === 1 ? 'it' : 'them'} first.`,
        );
      }

      return {
        label: row.companyname,
        tables: [{ table: 'lifeplancompany', key: 'companyid', rows: [row] }],
        files: [],
      };
    },
  },
};

/** E.g. "contract, 3 documents, 2 payments", or null if nothing else went. */
export function summarize(
  rootTable: string,
  tables: SnapshotTable[],
): string | null {
  const parts = tables
    .filter((t) => t.table !== rootTable && !t.keep && t.rows.length > 0)
    .map((t) => {
      const names = TABLE_NAMES[t.table] ?? [t.table, t.table];
      return t.rows.length === 1 ? names[0] : plural(t.rows.length, names);
    });
  return parts.length > 0 ? parts.join(', ') : null;
}
