import { Router } from 'express';
import pool from '../db.ts';

const router = Router();

router.get('/', async (_req, res) => {
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

router.get('/:id', async (req, res) => {
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

export default router;
