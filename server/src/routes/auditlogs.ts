import { Router } from 'express';
import requireAuth from '@/middleware/require-auth';
import requireAdmin from '@/middleware/require-admin';
import * as AuditLogModel from '@/model/audit-log';

const router = Router();

/** Returns the audit history to administrators in newest-first order. */
router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const result = await AuditLogModel.getAuditLogs();
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
