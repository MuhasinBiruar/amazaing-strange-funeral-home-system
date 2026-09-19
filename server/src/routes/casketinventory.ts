import { Router } from 'express';
import pool from '@/db';
import requireAuth from '@/middleware/require-auth';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM casketinventory ORDER BY caskettier, caskettype',
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
