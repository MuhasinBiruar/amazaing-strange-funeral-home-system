import { Router, type Response } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validateParams from '@/middleware/validate-params';
import { NotFoundError } from '@/errors';
import { getAccess } from '@/model/access';
import { toExclusiveEndBound } from '@/util/date';
import {
  accessPageEnum,
  getNotificationsQuerySchema,
  NOTIFICATION_CATEGORY_TYPES,
  NOTIFICATION_TYPES_RESOLVED_ON_READ,
  type AccessPage,
} from 'shared';
import { idParamSchema } from 'shared/utils';

const router = Router();

const NOTIFICATION_LIMIT = 6;
// Admin read-all state uses one cursor that applies to every audience.
const ALL_AUDIENCES = '*';

/** Whether staff `$1` has read notification `n`, individually or via read-all. */
const IS_READ_SQL = `(
  EXISTS (
    SELECT 1
    FROM notificationread nr
    WHERE nr.notificationid = n.notificationid AND nr.staffid = $1
  )
  OR EXISTS (
    SELECT 1
    FROM staffnotificationcursor c
    WHERE c.staffid = $1
      -- A cursor marks all older notifications for that audience read;
      -- notificationread still handles individual/out-of-order reads.
      AND (c.audience = '${ALL_AUDIENCES}' OR c.audience = ANY(n.audience))
      AND c.notificationid >= n.notificationid
  )
)`;

/**
 * Builds the visibility filter for the signed-in staff member: admins and
 * superadmins see every notification, everyone else only those addressed to a
 * page they have access to.
 *
 * @returns A SQL condition on alias `n` and its parameters, starting at `$2`
 * (`$1` is always the staff id).
 * @param audienceParam PostgreSQL parameter containing the user's audience
 * pages; individual-read uses `$3` because `$2` is the notification id.
 */
async function getVisibility(res: Response, audienceParam = 2) {
  const { user } = res.locals.session;
  if (user.role === 'admin' || user.role === 'superadmin') {
    return { condition: 'TRUE', params: [], pages: [], isAdmin: true };
  }

  let pages: AccessPage[] = [];
  try {
    const access = await getAccess(user.id);
    pages = accessPageEnum.options.filter((page) => access[page]);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }

  return {
    condition: `n.audience && $${audienceParam}::text[]`,
    params: [pages],
    pages,
    isAdmin: false,
  };
}

/**
 * Resolves the {@link NOTIFICATION_TYPES_RESOLVED_ON_READ} notifications staff `staffid` has now
 * read, whether one at a time or with "Mark all as read".
 */
async function resolveReadNotifications(staffid: string) {
  await pool.query(
    `UPDATE notification n
     SET resolvedat = now()
     WHERE n.type = ANY($2::text[])
       AND n.resolvedat IS NULL
       AND ${IS_READ_SQL}`,
    [staffid, NOTIFICATION_TYPES_RESOLVED_ON_READ],
  );
}

async function countUnread(staffid: string, res: Response) {
  const { condition, params } = await getVisibility(res);
  const result = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM notification n
     WHERE ${condition}
       AND NOT ${IS_READ_SQL}`,
    [staffid, ...params],
  );
  return result.rows[0].count;
}

/**
 * Sample URLs
 * `http://localhost:4000/notifications`
 * `http://localhost:4000/notifications?category=stocks&readStatus=unread&page=2`
 * `http://localhost:4000/notifications?startDate=2026-11-01&endDate=2026-11-08`
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, category, readStatus, startDate, endDate } =
      getNotificationsQuerySchema.parse(req.query);
    const staffid: string = res.locals.session.user.id;
    const { condition, params } = await getVisibility(res);

    // Start building `whereClause`
    const whereConditions = [condition];
    const queryParams: unknown[] = [staffid, ...params];

    if (category) {
      queryParams.push(NOTIFICATION_CATEGORY_TYPES[category]);
      whereConditions.push(`n.type = ANY($${queryParams.length}::text[])`);
    }

    if (startDate) {
      queryParams.push(startDate);
      whereConditions.push(`n.createdat >= $${queryParams.length}`);
    }

    if (endDate) {
      queryParams.push(toExclusiveEndBound(endDate));
      whereConditions.push(`n.createdat < $${queryParams.length}`);
    }

    if (readStatus) {
      whereConditions.push(
        readStatus === 'read' ? IS_READ_SQL : `NOT ${IS_READ_SQL}`,
      );
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    // Finish building `whereClause`

    const limitParam = queryParams.length + 1;
    const offsetParam = limitParam + 1;

    const result = await pool.query(
      `SELECT
         n.notificationid, n.type, n.title, n.message, n.caseid, n.link,
         n.createdat, n.resolvedat,
         ${IS_READ_SQL} AS isread
       FROM notification n
       ${whereClause}
       ORDER BY n.createdat DESC, n.notificationid DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...queryParams, NOTIFICATION_LIMIT, (page - 1) * NOTIFICATION_LIMIT],
    );

    res.json({
      data: result.rows,
      meta: {
        unreadCount: await countUnread(staffid, res),
        hasMore: result.rows.length === NOTIFICATION_LIMIT,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', requireAuth, async (_req, res, next) => {
  try {
    const unreadCount = await countUnread(res.locals.session.user.id, res);
    res.json({ data: { unreadCount } });
  } catch (error) {
    next(error);
  }
});

router.patch('/read-all', requireAuth, async (_req, res, next) => {
  try {
    const staffid: string = res.locals.session.user.id;
    const { pages, isAdmin } = await getVisibility(res);

    // Do not fan out one read row per notification. A high-water mark keeps
    // read-all proportional to the number of audiences, not history size.
    if (isAdmin) {
      await pool.query(
        `INSERT INTO staffnotificationcursor (staffid, audience, notificationid)
         SELECT $1, '${ALL_AUDIENCES}', COALESCE(MAX(notificationid), 0)
         FROM notification
         ON CONFLICT (staffid, audience) DO UPDATE
         SET notificationid = GREATEST(
               staffnotificationcursor.notificationid,
               EXCLUDED.notificationid
             ),
             updatedat = now()`,
        [staffid],
      );
    } else if (pages.length > 0) {
      await pool.query(
        `INSERT INTO staffnotificationcursor (staffid, audience, notificationid)
         SELECT $1, page, COALESCE(MAX(n.notificationid), 0)
         FROM unnest($2::text[]) AS page
         LEFT JOIN notification n
           ON n.audience @> ARRAY[page]::text[]
         GROUP BY page
         ON CONFLICT (staffid, audience) DO UPDATE
         SET notificationid = GREATEST(
               staffnotificationcursor.notificationid,
               EXCLUDED.notificationid
             ),
             updatedat = now()`,
        [staffid, pages],
      );
    }

    await resolveReadNotifications(staffid);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/read',
  requireAuth,
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      const staffid: string = res.locals.session.user.id;
      const { condition, params } = await getVisibility(res, 3);

      // Individual reads remain sparse rows so a notification can be read
      // without advancing the user's read-all cursor.
      await pool.query(
        `INSERT INTO notificationread (notificationid, staffid)
         SELECT $2, $1
         FROM notification n
         WHERE n.notificationid = $2 AND ${condition}
         ON CONFLICT DO NOTHING`,
        [staffid, req.params.id, ...params],
      );

      await resolveReadNotifications(staffid);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
