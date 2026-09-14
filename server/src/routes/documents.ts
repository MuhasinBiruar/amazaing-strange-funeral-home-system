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
import { NotFoundError, BadRequestError } from '@/errors';
import { getDeceasedName } from '@/util/audit-log';
import { publicDocumentUrl, uploadDocumentFile } from '@/lib/s3';
import {
  getDocumentsQuerySchema,
  uploadDocumentFormSchema,
} from 'shared';

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
 * it against a case. Multipart form data: `documenttype` and `caseid` as
 * fields, the file itself under the `file` field name.
 *
 * @remarks
 * `verificationstatus` and `uploaddate` are left to their database defaults
 * (`'pending'`, `CURRENT_DATE`) rather than being accepted from the client —
 * a document is always freshly pending right after upload.
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

      const result = await pool.query(
        `
        INSERT INTO document (
          documenttype,
          verifiedby,
          caseid,
          filename
        ) VALUES ($1, $2, $3, $4)
        RETURNING *;`,
        [parsed.documenttype, staffid, parsed.caseid, key],
      );

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
