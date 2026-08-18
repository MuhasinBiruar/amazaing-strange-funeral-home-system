import { Router } from 'express';
import pool from '../db.ts';
import requireAuth from '../middleware/require-auth.ts';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * from Staff');

    res.json({
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:username', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query('SELECT * FROM Staff WHERE username = $1', [
      username,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Staff member not found' });

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
