import type { NextFunction, Request, Response } from 'express';
import { writeAuditLog } from '@/util/audit-log';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'DELETE']);

/**
 * Writes an audit log entry after a successful mutating request, if the
 * route handler described what happened via `res.locals.auditAction`.
 *
 * @remarks
 * Registered once, globally. Doing the write on `res.on('finish')` means it
 * runs only after the response has already been sent, so it can never delay
 * or fail the actual request — a route that doesn't set `auditAction`, or a
 * request that fails (`requireAuth` rejects it, validation fails, the
 * response isn't 2xx), is simply not logged. Logging failures themselves are
 * swallowed and reported to the console rather than surfaced to the client.
 */
export default function auditLog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on('finish', () => {
    if (!AUDITED_METHODS.has(req.method)) return;
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    const action: string | undefined = res.locals.auditAction;
    const staffid: string | undefined = res.locals.session?.user?.id;
    if (!action || !staffid) return;

    writeAuditLog(staffid, action).catch((error) => {
      console.error('Failed to write audit log:', error);
    });
  });

  next();
}
