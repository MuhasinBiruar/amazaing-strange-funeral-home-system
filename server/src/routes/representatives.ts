import pool from '@/db.ts';
import requireAuth from '@/middleware/require-auth.ts';
import validate from '@/middleware/validate.ts';
import {
  representativeSchema,
  type RepresentativeSchema,
} from '@/schemas/representative.ts';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * from representative');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching representatives:');
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM representative WHERE representativeid = $1',
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Representative not found' });

    res.json({
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error fetching representative with id = ${id}`);
    next(error);
  }
});

router.post(
  '/',
  validate(representativeSchema),
  async (
    req: Request<{}, {}, RepresentativeSchema>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsed = req.body;
      const result = await pool.query(
        `
      INSERT INTO representative (
        firstname,
        middlename,
        lastname,
        relationship,
        contactnumber,
        address,
        datecreated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `,
        [
          parsed.firstname,
          parsed.middlename,
          parsed.lastname,
          parsed.relationship,
          parsed.contactnumber,
          parsed.address,
          parsed.datecreated,
        ],
      );

      res.status(201).json({
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating representative:');
      next(error);
    }
  },
);

export default router;
