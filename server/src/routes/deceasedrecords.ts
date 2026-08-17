import { Router, type Request, type Response } from 'express';
import pool from '../db.ts';
import {
  deceasedrecordsSchema,
  type DeceasedRecord,
} from '../schemas/deceasedrecords.ts';
import validate from '../middleware/validate.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * from DeceasedRecord');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM DeceasedRecord WHERE caseid = $1',
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Record not found' });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post(
  '/',
  validate(deceasedrecordsSchema),
  async (req: Request<{}, {}, DeceasedRecord>, res: Response) => {
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
        managedby
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        ],
      );

      res.status(201).json({
        message: 'Record created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating record:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
);

export default router;
