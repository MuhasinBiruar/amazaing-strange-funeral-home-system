import { Router, type Response } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validateParams from '@/middleware/validate-params';
import { NotFoundError } from '@/errors';
import { getAccess } from '@/model/access';
import {
  accessPageEnum,
  getNotificationsQuerySchema,
  type AccessPage,
} from 'shared';
import { idParamSchema } from 'shared/utils';

const router = Router();

const NOTIFICATION_LIMIT = 6;
// Admin read-all state uses one cursor that applies to every audience.
const ALL_AUDIENCES = '*';

/**
 * Builds the visibility filter for the signed-in staff member: admins see
 * every notification, everyone else only those addressed to a page they have
 * access to.
 *
 * @returns A SQL condition on alias `n` and its parameters, starting at `$2`
 * (`$1` is always the staff id).
 * @param audienceParam PostgreSQL parameter containing the user's audience
 * pages; individual-read uses `$3` because `$2` is the notification id.
 */
async function getVisibility(res: Response, audienceParam = 2) {
  const { user } = res.locals.session;
  if (user.role === 'admin') {
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

async function countUnread(staffid: string, res: Response) {
  const { condition, params } = await getVisibility(res);
  const result = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM notification n
     LEFT JOIN notificationread nr
       ON nr.notificationid = n.notificationid AND nr.staffid = $1
     WHERE ${condition}
       AND nr.notificationid IS NULL
       AND NOT EXISTS (
         SELECT 1
         FROM staffnotificationcursor c
         WHERE c.staffid = $1
           -- A cursor marks all older notifications for that audience read;
           -- notificationread still handles individual/out-of-order reads.
           AND (c.audience = '${ALL_AUDIENCES}' OR c.audience = ANY(n.audience))
           AND c.notificationid >= n.notificationid
       )`,
    [staffid, ...params],
  );
  return result.rows[0].count;
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page } = getNotificationsQuerySchema.parse(req.query);
    const staffid: string = res.locals.session.user.id;
    const { condition, params } = await getVisibility(res);
    const limitParam = 2 + params.length;
    const offsetParam = limitParam + 1;

    const result = await pool.query(
      `SELECT
         n.notificationid, n.type, n.title, n.message, n.caseid, n.link,
         n.createdat, n.resolvedat,
         (
           nr.notificationid IS NOT NULL
           OR EXISTS (
             SELECT 1
             FROM staffnotificationcursor c
             WHERE c.staffid = $1
               -- Keep the API's per-notification isread value compatible with
               -- the cursor-based unread count.
               AND (c.audience = '${ALL_AUDIENCES}' OR c.audience = ANY(n.audience))
               AND c.notificationid >= n.notificationid
           )
         ) AS isread
       FROM notification n
       LEFT JOIN notificationread nr
         ON nr.notificationid = n.notificationid AND nr.staffid = $1
       WHERE ${condition}
       ORDER BY n.createdat DESC, n.notificationid DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [staffid, ...params, NOTIFICATION_LIMIT, (page - 1) * NOTIFICATION_LIMIT],
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

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
