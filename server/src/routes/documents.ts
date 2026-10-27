import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';
import { uploadDocument } from '@/middleware/upload';
import { BadRequestError, ConflictError, NotFoundError } from '@/errors';
import { getDeceasedName } from '@/util/audit-log';
import { publicDocumentUrl, uploadDocumentFile } from '@/lib/s3';
import { triggerNotificationSweep } from '@/lib/notifications';
import { withTransaction } from '@/util/with-transaction';
import validate from '@/middleware/validate';
import validateParams from '@/middleware/validate-params';
import {
  createDocumentRequirementSchema,
  getDocumentsQuerySchema,
  updateDocumentVerificationQuerySchema,
  uploadDocumentFormSchema,
  type UpdateDocumentVerificationQuery,
} from 'shared';
import { idParamSchema, type IdParam } from 'shared/utils';

const router = Router();

/** Attaches a public viewing/download URL to a document row, or `null` if it predates file storage. */
function withUrl(row: Record<string, unknown>) {
  return {
    ...row,
    url: row.filename ? publicDocumentUrl(row.filename as string) : null,
  };
}

/**
 * Sample URLs
 * `http://localhost:4000/documents`
 * `http://localhost:4000/documents?caseid=12`
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { caseid } = getDocumentsQuerySchema.parse(req.query);

    const result = caseid
      ? await pool.query(
          'SELECT * FROM Document WHERE caseid = $1 ORDER BY uploaddate DESC, documentid DESC',
          [caseid],
        )
      : await pool.query(
          'SELECT * from Document ORDER BY uploaddate DESC, documentid DESC',
        );

    res.json({
      data: result.rows.map(withUrl),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/requirements', requireAuth, async (req, res, next) => {
  try {
    const parsed = createDocumentRequirementSchema.parse(req.body);
    const normalizedType = parsed.documenttype.trim();

    const { row, created } = await withTransaction(async (client) => {
      await client.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`${parsed.caseid}:${normalizedType.toLowerCase()}`],
      );

      const existing = await client.query(
        `SELECT * FROM document
         WHERE caseid = $1 AND LOWER(BTRIM(documenttype)) = LOWER(BTRIM($2))
         ORDER BY documentid DESC
         FOR UPDATE`,
        [parsed.caseid, normalizedType],
      );

      if (existing.rows.some((document) => document.filename !== null)) {
        throw new ConflictError(
          `A ${normalizedType} document has already been submitted.`,
        );
      }

      if (existing.rows.length > 0) {
        return { row: existing.rows[0], created: false };
      }

      const result = await client.query(
        `INSERT INTO document (documenttype, verifiedby, caseid, filename)
         VALUES ($1, NULL, $2, NULL)
         RETURNING *`,
        [normalizedType, parsed.caseid],
      );

      return { row: result.rows[0], created: true };
    });

    if (created) {
      const deceasedName = await getDeceasedName(parsed.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} added a ${normalizedType} document requirement for ${deceasedName}`;
    }

    res.status(created ? 201 : 200).json({
      data: withUrl(row),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const documentid = Number(req.params.id);
    if (!Number.isInteger(documentid) || documentid < 1) {
      throw new BadRequestError('Invalid document ID.');
    }

    const result = await pool.query(
      'DELETE FROM document WHERE documentid = $1 AND filename IS NULL RETURNING *',
      [documentid],
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT documentid FROM document WHERE documentid = $1',
        [documentid],
      );
      if (existing.rows.length === 0) throw new NotFoundError();
      throw new ConflictError('Submitted documents cannot be removed.');
    }

    const document = result.rows[0];
    const deceasedName = await getDeceasedName(document.caseid);
    res.locals.auditAction = `${res.locals.session.user.name} removed the ${document.documenttype} document requirement for ${deceasedName}`;
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

const VERIFICATION_VERBS: Record<
  UpdateDocumentVerificationQuery['verificationstatus'],
  string
> = {
  verified: 'approved',
  rejected: 'rejected',
  pending: 'reset the review of',
};

/**
 * Approves (`verified`), rejects, or resets (`pending`) a submitted document.
 *
 * @remarks
 * Rejecting a document means the case needs that document again, so a
 * requirement placeholder (a `filename IS NULL` row) of the same type is added
 * unless one already exists; it then shows under "Missing documents", and the
 * next upload of that type fills it. Moving a document back out of `rejected`
 * removes those placeholders again, since the document covers its type once
 * more.
 *
 * The same per-case/per-type advisory lock as `POST /` is taken, so an upload
 * filling a placeholder can't race this.
 */
router.patch(
  '/:id/verification',
  requireAuth,
  validateParams(idParamSchema),
  validate(updateDocumentVerificationQuerySchema),
  async (
    req: Request<IdParam, {}, UpdateDocumentVerificationQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const { verificationstatus } = req.body;
      const staffid = res.locals.session.user.id;

      const updated = await withTransaction(async (client) => {
        const existing = await client.query(
          'SELECT caseid, documenttype FROM document WHERE documentid = $1',
          [id],
        );
        if (existing.rows.length === 0) throw new NotFoundError();
        const { caseid, documenttype } = existing.rows[0];

        await client.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`${caseid}:${documenttype.trim().toLowerCase()}`],
        );

        const current = await client.query(
          'SELECT * FROM document WHERE documentid = $1 FOR UPDATE',
          [id],
        );
        const document = current.rows[0];
        if (document.filename === null) {
          throw new ConflictError(
            'Only uploaded documents can be approved or rejected.',
          );
        }

        // Approving or rejecting records who decided; resetting to pending
        // keeps whoever was last recorded.
        const result = await client.query(
          `UPDATE document
           SET verificationstatus = $1,
               verifiedby = COALESCE($2, verifiedby)
           WHERE documentid = $3
           RETURNING *`,
          [
            verificationstatus,
            verificationstatus === 'pending' ? null : staffid,
            id,
          ],
        );

        const wasRejected = document.verificationstatus === 'rejected';
        const isRejected = verificationstatus === 'rejected';

        if (isRejected && !wasRejected) {
          await client.query(
            `INSERT INTO document (documenttype, caseid)
             SELECT $1::text, $2
             WHERE NOT EXISTS (
               SELECT 1 FROM document
               WHERE caseid = $2
                 AND LOWER(BTRIM(documenttype)) = LOWER(BTRIM($1::text))
                 AND filename IS NULL
             )`,
            [documenttype, caseid],
          );
        } else if (wasRejected && !isRejected) {
          await client.query(
            `DELETE FROM document
             WHERE caseid = $1
               AND LOWER(BTRIM(documenttype)) = LOWER(BTRIM($2))
               AND filename IS NULL`,
            [caseid, documenttype],
          );
        }

        return result.rows[0];
      });

      triggerNotificationSweep();

      const deceasedName = await getDeceasedName(updated.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} ${VERIFICATION_VERBS[verificationstatus]} the ${updated.documenttype} document for ${deceasedName}`;

      res.json({ data: withUrl(updated) });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM Document WHERE documentid = $1',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: withUrl(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

/**
 * Uploads a document file (image or PDF) to the documents bucket and records
 * it against a case, filling an existing null-filename requirement when one
 * matches. Multipart form data: `documenttype` and `caseid` as fields, the
 * file itself under the `file` field name.
 *
 * @remarks
 * `verificationstatus` and `uploaddate` are left to their database defaults
 * (`'pending'`, `CURRENT_DATE`) rather than being accepted from the client.
 */
router.post(
  '/',
  requireAuth,
  uploadDocument,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new BadRequestError('No file was uploaded.');

      const parsed = uploadDocumentFormSchema.parse(req.body);
      const staffid = res.locals.session.user.id;

      const key = `documents/${parsed.caseid}/${randomUUID()}${extname(req.file.originalname)}`;
      await uploadDocumentFile(key, req.file.buffer, req.file.mimetype);

      const result = await withTransaction(async (client) => {
        await client.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`${parsed.caseid}:${parsed.documenttype.trim().toLowerCase()}`],
        );

        const requirement = await client.query(
          `SELECT documentid FROM document
           WHERE caseid = $1
             AND LOWER(BTRIM(documenttype)) = LOWER(BTRIM($2))
             AND filename IS NULL
           ORDER BY documentid
           LIMIT 1
           FOR UPDATE`,
          [parsed.caseid, parsed.documenttype.trim()],
        );

        if (requirement.rows.length > 0) {
          return client.query(
            `UPDATE document
             SET verifiedby = $1, filename = $2, verificationstatus = 'pending',
                 uploaddate = CURRENT_DATE
             WHERE documentid = $3
             RETURNING *`,
            [staffid, key, requirement.rows[0].documentid],
          );
        }

        return client.query(
          `INSERT INTO document (
            documenttype,
            verifiedby,
            caseid,
            filename
          ) VALUES ($1, $2, $3, $4)
          RETURNING *`,
          [parsed.documenttype, staffid, parsed.caseid, key],
        );
      });

      triggerNotificationSweep();

      const deceasedName = await getDeceasedName(parsed.caseid);
      res.locals.auditAction = `${res.locals.session.user.name} uploaded a ${parsed.documenttype} document for ${deceasedName}`;

      res.status(201).json({
        data: withUrl(result.rows[0]),
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
