import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import {
  DELETION_ENTITY_LABELS,
  deleteAllRecordsQuerySchema,
  deleteRecordsQuerySchema,
  getDeletionsQuerySchema,
  restoreDeletionsQuerySchema,
  type DeleteAllRecordsQuery,
  type DeleteRecordsQuery,
  type DeletionEntityType,
  type DeletionLog,
  type DeletionResult,
  type RestoreDeletionsQuery,
} from 'shared';
import requireAuth from '@/middleware/require-auth';
import requireAdmin from '@/middleware/require-admin';
import requireSuperadmin from '@/middleware/require-superadmin';
import validate from '@/middleware/validate';
import { withRepeatableRead } from '@/util/with-repeatable-read';
import { toExclusiveEndBound } from '@/util/date';
import { deleteRecords, restoreDeletions } from '@/lib/deletions';
import { triggerNotificationSweep } from '@/lib/notifications';

const router = Router();

const SORT_COLUMNS: Record<keyof DeletionLog, string> = {
  deletionid: 'd.deletionid',
  entitytype: 'd.entitytype',
  entityid: 'd.entityid',
  label: 'd.label',
  summary: 'd.summary',
  deletedby: 'd.deletedby',
  deletedby_name: 'deletedby_name',
  deletedat: 'd.deletedat',
  purgeafter: 'd.purgeafter',
};

/** E.g. "deleted case Juan Dela Cruz (case #12)" or "restored 3 expenses: ...". */
function describe(
  verb: string,
  result: DeletionResult,
  entitytype?: DeletionEntityType,
) {
  const labels = result.succeeded.map((s) => s.label);
  const noun = entitytype
    ? DELETION_ENTITY_LABELS[entitytype]
    : { singular: 'item', plural: 'items' };
  if (labels.length === 1) return `${verb} ${noun.singular} ${labels[0]}`;

  const shown = labels.slice(0, 5).join('; ');
  const more = labels.length > 5 ? ` and ${labels.length - 5} more` : '';
  return `${verb} ${labels.length} ${noun.plural}: ${shown}${more}`;
}

/**
 * Sample URLs
 * `http://localhost:4000/deletions`
 * `http://localhost:4000/deletions?entitytype=case`
 * `http://localhost:4000/deletions?search=Juan&sortBy=purgeafter&sortOrder=asc&page=1&limit=20`
 */
router.get(
  '/',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page,
        limit,
        search,
        entitytype,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = getDeletionsQuerySchema.parse(req.query);

      const selectClause = `
        SELECT
          d.deletionid,
          d.entitytype,
          d.entityid,
          d.label,
          d.summary,
          d.deletedby,
          CONCAT_WS(' ', NULLIF(s."firstName", ''), NULLIF(s."middleName", ''), NULLIF(s."lastName", '')) AS deletedby_name,
          d.deletedat,
          d.purgeafter
      `;

      const fromAndJoins = `
        FROM public.deletion d
        LEFT JOIN public.staff s ON s.id = d.deletedby
      `;

      // Start building `whereClause`. Entries past their 30 days are hidden
      // even before the daily purge actually removes them.
      const whereConditions: string[] = ['d.purgeafter > now()'];
      const queryParams: unknown[] = [];
      let paramIndex = 1;

      if (entitytype) {
        whereConditions.push(`d.entitytype = $${paramIndex}`);
        queryParams.push(entitytype);
        paramIndex++;
      }

      if (search) {
        // Searches through: deletion.label, deletion.summary, staff.name
        whereConditions.push(`(
          d.label ILIKE $${paramIndex} OR
          d.summary ILIKE $${paramIndex} OR
          CONCAT_WS(' ', s."firstName", s."middleName", s."lastName") ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`d.deletedat >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`d.deletedat < $${paramIndex}`);
        queryParams.push(toExclusiveEndBound(endDate));
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      // Finish building `whereClause`

      const orderByClause = `ORDER BY ${SORT_COLUMNS[sortBy]} ${sortOrder === 'desc' ? 'DESC' : 'ASC'} NULLS LAST, d.deletionid DESC`;
      const paginationClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

      const [dataResult, countResult] = await withRepeatableRead(
        async (client) =>
          await Promise.all([
            client.query(
              `${selectClause} ${fromAndJoins} ${whereClause} ${orderByClause} ${paginationClause}`,
              [...queryParams, limit, (page - 1) * limit],
            ),
            client.query(
              `SELECT COUNT(*) AS total ${fromAndJoins} ${whereClause}`,
              queryParams,
            ),
          ]),
      );

      const totalRecords = parseInt(countResult.rows[0].total, 10);
      res.json({
        data: dataResult.rows,
        meta: {
          total: totalRecords,
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Moves the selected records to Deleted items for 30 days. Admins only, and
 * at most 100 at a time; deleting a whole table is {@link POST /all}.
 */
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(deleteRecordsQuerySchema),
  async (
    req: Request<{}, {}, DeleteRecordsQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { entitytype, ids } = req.body;
      const result = await deleteRecords(
        entitytype,
        ids,
        res.locals.session.user.id,
      );

      if (result.succeeded.length > 0) {
        triggerNotificationSweep();
        res.locals.auditAction = `${res.locals.session.user.name} ${describe('deleted', result, entitytype)}`;
      }
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Delete all: moves every record a table lists to Deleted items. Superadmins
 * only, confirmed by typing `DELETE_ALL_CONFIRMATION`.
 */
router.post(
  '/all',
  requireAuth,
  requireSuperadmin,
  validate(deleteAllRecordsQuerySchema),
  async (
    req: Request<{}, {}, DeleteAllRecordsQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { entitytype, ids } = req.body;
      const result = await deleteRecords(
        entitytype,
        ids,
        res.locals.session.user.id,
      );

      if (result.succeeded.length > 0) {
        triggerNotificationSweep();
        res.locals.auditAction = `${res.locals.session.user.name} used Delete all and ${describe('deleted', result, entitytype)}`;
      }
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

/** Puts Deleted items entries back where they were. */
router.post(
  '/restore',
  requireAuth,
  requireAdmin,
  validate(restoreDeletionsQuerySchema),
  async (
    req: Request<{}, {}, RestoreDeletionsQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await restoreDeletions(req.body.deletionids);

      if (result.succeeded.length > 0) {
        triggerNotificationSweep();
        res.locals.auditAction = `${res.locals.session.user.name} ${describe('restored', result)}`;
      }
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
