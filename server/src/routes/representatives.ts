import pool from '@/db.ts';
import { Router } from 'express';

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

export default router;
