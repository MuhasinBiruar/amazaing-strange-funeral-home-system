import { Router, type Response } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import validateParams from '@/middleware/validate-params';
import { NotFoundError } from '@/errors';
import { getAccess } from '@/model/access';
import { accessPageEnum, type AccessPage } from 'shared';
import { idParamSchema } from 'shared/utils';

const router = Router();

const NOTIFICATION_LIMIT = 30;

/**
 * Builds the visibility filter for the signed-in staff member: admins see
 * every notification, everyone else only those addressed to a page they have
 * access to.
 *
 * @returns A SQL condition on alias `n` and its parameters, starting at `$2`
 * (`$1` is always the staff id).
 */
async function getVisibility(res: Response) {
  const user = res.locals.session.user;
  if (user.role === 'admin') return { condition: 'TRUE', params: [] };

  let pages: AccessPage[] = [];
  try {
    const access = await getAccess(user.id);
    pages = accessPageEnum.options.filter((page) => access[page]);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }

  return { condition: 'n.audience && $2::text[]', params: [pages] };
}

async function countUnread(staffid: string, res: Response) {
  const { condition, params } = await getVisibility(res);
  const result = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM notification n
     LEFT JOIN notificationread nr
       ON nr.notificationid = n.notificationid AND nr.staffid = $1
     WHERE ${condition} AND nr.notificationid IS NULL`,
    [staffid, ...params],
  );
  return result.rows[0].count;
}

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const staffid: string = res.locals.session.user.id;
    const { condition, params } = await getVisibility(res);

    const result = await pool.query(
      `SELECT
         n.notificationid, n.type, n.title, n.message, n.caseid, n.link,
         n.createdat, n.resolvedat,
         (nr.notificationid IS NOT NULL) AS isread
       FROM notification n
       LEFT JOIN notificationread nr
         ON nr.notificationid = n.notificationid AND nr.staffid = $1
       WHERE ${condition}
       ORDER BY n.createdat DESC, n.notificationid DESC
       LIMIT ${NOTIFICATION_LIMIT}`,
      [staffid, ...params],
    );

    res.json({
      data: result.rows,
      meta: { unreadCount: await countUnread(staffid, res) },
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
    const { condition, params } = await getVisibility(res);

    await pool.query(
      `INSERT INTO notificationread (notificationid, staffid)
       SELECT n.notificationid, $1 FROM notification n WHERE ${condition}
       ON CONFLICT DO NOTHING`,
      [staffid, ...params],
    );

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
      await pool.query(
        `INSERT INTO notificationread (notificationid, staffid)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.id, res.locals.session.user.id],
      );

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
