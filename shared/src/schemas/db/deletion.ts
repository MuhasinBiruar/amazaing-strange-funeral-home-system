import z from 'zod';

/** What a Deleted items entry holds. Staff, audit logs and notifications can't be deleted. */
export const deletionEntityTypeEnum = z.enum([
  'case',
  'expense',
  'casketdelivery',
  'formalindelivery',
  'formalinusage',
  'casketinventory',
  'lgu',
  'lifeplancompany',
  'package',
  'burialrecord',
]);

export type DeletionEntityType = z.infer<typeof deletionEntityTypeEnum>;

export const DELETION_ENTITY_LABELS: Record<
  DeletionEntityType,
  { singular: string; plural: string }
> = {
  case: { singular: 'case', plural: 'cases' },
  expense: { singular: 'expense', plural: 'expenses' },
  casketdelivery: { singular: 'casket delivery', plural: 'casket deliveries' },
  formalindelivery: {
    singular: 'formalin delivery',
    plural: 'formalin deliveries',
  },
  formalinusage: { singular: 'formalin usage', plural: 'formalin usages' },
  casketinventory: { singular: 'casket', plural: 'caskets' },
  lgu: { singular: 'LGU', plural: 'LGUs' },
  lifeplancompany: {
    singular: 'life plan company',
    plural: 'life plan companies',
  },
  package: { singular: 'package', plural: 'packages' },
  burialrecord: { singular: 'burial record', plural: 'burial records' },
};

/** Days a deleted record stays restorable before it's permanently removed. */
export const DELETION_RETENTION_DAYS = 30;

/** Exact (case-sensitive) text a superadmin types to confirm Delete all. */
export const DELETE_ALL_CONFIRMATION = 'Villa Elisa';

/**
 * A record moved to Deleted items. The removed rows themselves are kept
 * server-side in a `snapshot` column that's never sent to the client.
 */
export const deletionSchema = z.object({
  deletionid: z.int32(),
  entitytype: deletionEntityTypeEnum,
  entityid: z.int32(),
  label: z.string(),
  /** What else was removed with it, e.g. "contract, 3 documents". */
  summary: z.string().nullable(),
  deletedby: z.string(),
  deletedat: z.coerce.date(),
  purgeafter: z.coerce.date(),
});

export type Deletion = z.infer<typeof deletionSchema>;

/** Deletes selected rows (one page at most). */
export const deleteRecordsQuerySchema = z.object({
  entitytype: deletionEntityTypeEnum,
  ids: z.array(z.int().positive()).min(1).max(100),
});

export type DeleteRecordsQuery = z.infer<typeof deleteRecordsQuerySchema>;

/** Deletes every row a table shows (superadmin only). */
export const deleteAllRecordsQuerySchema = z.object({
  entitytype: deletionEntityTypeEnum,
  ids: z.array(z.int().positive()).min(1).max(10000),
  confirmation: z.literal(DELETE_ALL_CONFIRMATION, {
    error: `Type ${DELETE_ALL_CONFIRMATION} exactly to confirm.`,
  }),
});

export type DeleteAllRecordsQuery = z.infer<typeof deleteAllRecordsQuerySchema>;

export const restoreDeletionsQuerySchema = z.object({
  deletionids: z.array(z.int().positive()).min(1).max(100),
});

export type RestoreDeletionsQuery = z.infer<typeof restoreDeletionsQuerySchema>;

/**
 * Outcome of deleting or restoring several records. Each one is handled on
 * its own, so one that's blocked (e.g. still in use) doesn't stop the rest.
 */
export const deletionResultSchema = z.object({
  succeeded: z.array(z.object({ id: z.int(), label: z.string() })),
  failed: z.array(
    z.object({
      id: z.int(),
      label: z.string().nullable(),
      message: z.string(),
    }),
  ),
});

export type DeletionResult = z.infer<typeof deletionResultSchema>;

export const deletionResultResponseSchema = z.object({
  data: deletionResultSchema,
});
