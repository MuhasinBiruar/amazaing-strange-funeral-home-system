import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '../db.ts';
import validate from '../middleware/validate.ts';
import {
  documentsSchema,
  type DocumentsSchemaType,
} from '../schemas/documents.ts';
import requireAuth from '../middleware/require-auth.ts';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * from Document');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM Document WHERE documentid = $1',
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Document not found' });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post(
  '/',
  requireAuth,
  validate(documentsSchema),
  async (
    req: Request<{}, {}, DocumentsSchemaType>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
      INSERT INTO document (
        documenttype,
        verificationstatus,
        uploaddate,
        verifiedby,
        caseid
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING documentid;`,
        [
          parsed.documenttype,
          parsed.verificationstatus,
          parsed.uploaddate,
          parsed.verifiedby,
          parsed.caseid,
        ],
      );

      res.status(201).json({
        message: 'Document created successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      console.error('Error creating document:', error);
      next(error);
    }
  },
);

export default router;
