import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import pool from '@/db.ts';
import {
  deceasedrecordSchema,
  type DeceasedRecordSchema,
} from '@/schemas/deceasedrecord';
import validate from '@/middleware/validate.ts';
import requireAuth from '@/middleware/require-auth.ts';
import { NotFoundError } from '@/errors';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from DeceasedRecord');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM DeceasedRecord WHERE caseid = $1',
      [id],
    );
    if (result.rows.length === 0) throw new NotFoundError();

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  requireAuth,
  validate(deceasedrecordSchema),
  async (
    req: Request<{}, {}, DeceasedRecordSchema>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
      INSERT INTO deceasedrecord (
        firstname,
        middlename,
        lastname,
        causeofdeath,
        typeofdeath,
        physicaldescription,
        servicestatus,
        hasmaturedlifeplan,
        plantype,
        datecreated,
        managedby,
        representedby
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING caseid;`,
        [
          parsed.firstname,
          parsed.middlename,
          parsed.lastname,
          parsed.causeofdeath,
          parsed.typeofdeath,
          parsed.physicaldescription,
          parsed.servicestatus,
          parsed.hasmaturedlifeplan,
          parsed.plantype,
          parsed.datecreated,
          parsed.managedby,
          parsed.representedby,
        ],
      );

      res.status(201).json({
        message: 'Record created successfully',
        data: result.rows[0],
      });
    } catch (error: any) {
      next(error);
    }
  },
);

export default router;
